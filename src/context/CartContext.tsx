import React, { createContext, useContext, useState } from 'react';
import { Cliente, Produto } from '../types/database';

export interface CartItem {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface CartContextType {
  itens: CartItem[];
  clienteSelecionado: Cliente | null;
  desconto: number;
  totalBruto: number;
  totalLiquido: number;
  adicionarProduto: (produto: Produto, quantidade?: number) => void;
  removerItem: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  setDescontoValor: (valor: number) => void;
  setCliente: (cliente: Cliente | null) => void;
  limparCarrinho: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [itens, setItens] = useState<CartItem[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [desconto, setDesconto] = useState<number>(0);

  const adicionarProduto = (produto: Produto, quantidade = 1) => {
    setItens(prev => {
      const idx = prev.findIndex(item => item.produto.id === produto.id);
      if (idx >= 0) {
        const novos = [...prev];
        const novaQtd = novos[idx].quantidade + quantidade;
        novos[idx] = {
          ...novos[idx],
          quantidade: novaQtd,
          subtotal: novaQtd * novos[idx].preco_unitario
        };
        return novos;
      } else {
        return [
          ...prev,
          {
            produto,
            quantidade,
            preco_unitario: produto.preco_venda,
            subtotal: quantidade * produto.preco_venda
          }
        ];
      }
    });
  };

  const removerItem = (produtoId: string) => {
    setItens(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(produtoId);
      return;
    }
    setItens(prev =>
      prev.map(item => {
        if (item.produto.id === produtoId) {
          return {
            ...item,
            quantidade,
            subtotal: quantidade * item.preco_unitario
          };
        }
        return item;
      })
    );
  };

  const setDescontoValor = (valor: number) => {
    setDesconto(Math.max(0, valor));
  };

  const setCliente = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente);
  };

  const limparCarrinho = () => {
    setItens([]);
    setClienteSelecionado(null);
    setDesconto(0);
  };

  const totalBruto = itens.reduce((acc, item) => acc + item.subtotal, 0);
  const totalLiquido = Math.max(0, totalBruto - desconto);

  return (
    <CartContext.Provider
      value={{
        itens,
        clienteSelecionado,
        desconto,
        totalBruto,
        totalLiquido,
        adicionarProduto,
        removerItem,
        alterarQuantidade,
        setDescontoValor,
        setCliente,
        limparCarrinho
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
