// src/hooks/useTodayStats.ts
import { useMemo } from 'react';
import { useInvoicesStore } from '../store/invoicesStore';
import { format, isToday } from 'date-fns';

export const useTodayStats = (salespersonId?: string) => {
  const { invoices } = useInvoicesStore();

  const todayStats = useMemo(() => {
    let todayInvoices = invoices.filter(invoice => 
      isToday(new Date(invoice.created_at))
    );

    // Filter by salesperson if provided
    if (salespersonId) {
      todayInvoices = todayInvoices.filter(
        invoice => invoice.salesperson === salespersonId
      );
    }

    const totalSales = todayInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total),
      0
    );

    const invoiceCount = todayInvoices.length;

    // Get recent invoices (last 3)
    const recentInvoices = todayInvoices.slice(0, 3);

    // Get top product
    const productCounts: Record<string, { name: string; count: number }> = {};
    
    todayInvoices.forEach(invoice => {
      invoice.items.forEach(item => {
        if (!productCounts[item.product]) {
          productCounts[item.product] = { name: item.product_name, count: 0 };
        }
        productCounts[item.product].count += item.quantity;
      });
    });

    const topProduct = Object.values(productCounts).sort((a, b) => b.count - a.count)[0]?.name;

    return {
      totalSales,
      invoiceCount,
      recentInvoices,
      topProduct,
      date: format(new Date(), 'EEEE, MMMM d, yyyy'),
    };
  }, [invoices, salespersonId]);

  return todayStats;
};