use std::fs::File;
use std::io::Write;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use futures_util::StreamExt;

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Sistema operacional não suportado".to_string())
    }
}

#[tauri::command]
async fn download_and_install_update(app: AppHandle, url: String) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let installer_path = temp_dir.join("nexflow_update_setup.exe");

    let client = reqwest::Client::builder()
        .user_agent("NexFlow-ERP-Updater/1.2")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    
    if !res.status().is_success() {
        return Err(format!("Falha no download da release: HTTP {}", res.status()));
    }

    let total_size = res.content_length().unwrap_or(0);
    let mut file = File::create(&installer_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let percentage = ((downloaded as f64 / total_size as f64) * 100.0) as u32;
            let _ = app.emit("update-progress", percentage);
        }
    }

    let _ = app.emit("update-progress", 100);

    // Executa o instalador em modo silencioso (/S) e fecha a versão antiga
    #[cfg(target_os = "windows")]
    {
        let path_str = installer_path.to_string_lossy().to_string();
        
        // Dispara o instalador silencioso do NSIS
        Command::new("cmd")
            .args(["/C", "start", "", &path_str, "/S"])
            .spawn()
            .map_err(|e| e.to_string())?;

        // Aguarda 1 segundo para o processo do instalador assumir e finaliza o app antigo
        std::thread::sleep(std::time::Duration::from_millis(1000));
        std::process::exit(0);
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![open_url, download_and_install_update])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
