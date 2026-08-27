import { EmpresaConfig, Venda } from '../types/database';
import { formatCurrency, formatDate, formaPagamentoLabel } from './formatters';

export const printReceipt = (venda: Venda, config: EmpresaConfig) => {
  const win = window.open('', '_blank', 'width=350,height=600');
  if (!win) {
    alert('Por favor, permita popups para imprimir o cupom de venda.');
    return;
  }

  const itensHtml = (venda.itens || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 2px 0;">${idx + 1}. ${item.produto_nome}<br>
          <small>${item.quantidade} x ${formatCurrency(item.preco_unitario)}</small>
        </td>
        <td style="text-align: right; vertical-align: bottom; padding: 2px 0;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Cupom de Venda #${venda.numero_venda}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: 72mm;
            margin: 4mm auto;
            color: #000;
            line-height: 1.2;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          .footer { margin-top: 12px; font-size: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 14px;">${config.nome_fantasia || 'EMPRESA'}</div>
        ${config.razao_social ? `<div class="text-center">${config.razao_social}</div>` : ''}
        ${config.cnpj ? `<div class="text-center">CNPJ: ${config.cnpj}</div>` : ''}
        ${config.telefone ? `<div class="text-center">Tel: ${config.telefone}</div>` : ''}
        ${config.endereco ? `<div class="text-center">${config.endereco}</div>` : ''}
        
        <div class="divider"></div>
        <div class="text-center bold">CUPOM NÃO FISCAL</div>
        <div>Venda: #${venda.numero_venda}</div>
        <div>Data: ${formatDate(venda.created_at)}</div>
        ${venda.cliente_nome ? `<div>Cliente: ${venda.cliente_nome}</div>` : ''}
        
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th style="text-align: left; border-bottom: 1px solid #000;">Item</th>
              <th style="text-align: right; border-bottom: 1px solid #000;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>
        
        <div class="divider"></div>
        <table>
          <tr>
            <td>Total Bruto:</td>
            <td class="text-right">${formatCurrency(venda.total_bruto)}</td>
          </tr>
          ${
            venda.desconto > 0
              ? `<tr>
            <td>Desconto:</td>
            <td class="text-right">- ${formatCurrency(venda.desconto)}</td>
          </tr>`
              : ''
          }
          <tr class="bold" style="font-size: 13px;">
            <td>TOTAL LÍQUIDO:</td>
            <td class="text-right">${formatCurrency(venda.total_liquido)}</td>
          </tr>
          <tr>
            <td>Pagamento:</td>
            <td class="text-right">${formaPagamentoLabel[venda.forma_pagamento] || venda.forma_pagamento}</td>
          </tr>
          ${
            venda.valor_pago
              ? `<tr>
            <td>Valor Recebido:</td>
            <td class="text-right">${formatCurrency(venda.valor_pago)}</td>
          </tr>`
              : ''
          }
          ${
            venda.troco
              ? `<tr>
            <td>Troco:</td>
            <td class="text-right">${formatCurrency(venda.troco)}</td>
          </tr>`
              : ''
          }
        </table>
        
        <div class="divider"></div>
        <div class="footer">
          <div>${config.mensagem_cupom || 'Obrigado pela preferência!'}</div>
          <div style="margin-top: 4px; font-size: 9px; color: #555;">NexFlow ERP • Sistema Offline & Nuvem</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
};
