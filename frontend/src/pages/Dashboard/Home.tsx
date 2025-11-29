// import React from "react";
// import {
//   FileText,
//   DollarSign,
//   Users,
//   TrendingUp,
//   TrendingDown,
//   CreditCard,
//   Wallet,
//   Building2,
//   Receipt,
//   Calculator,
//   Activity,
//   Calendar,
// } from "lucide-react";
// import { useApi } from "../../hooks";
// import { dashboardApi } from "../../services/api";
// import Chart from "react-apexcharts";

// const formatCurrency = (value: number) => {
//   return new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "USD",
//     minimumFractionDigits: 2,
//   }).format(value);
// };

// const formatNumber = (value: number) => {
//   return new Intl.NumberFormat("en-US").format(value);
// };

export default function Home() {
  // const { data: stats, loading } = useApi(() => dashboardApi.getStats());

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  // const documents = stats?.documents || {};
  // const parties = stats?.parties || {};
  // const accounting = stats?.accounting || {};
  // const financial = stats?.financial || {};

  // // Chart data for Revenue vs Expenses
  // const revenueExpensesChart = {
  //   series: [
  //     {
  //       name: "Revenue",
  //       data: [accounting.totalRevenue || 0],
  //     },
  //     {
  //       name: "Expenses",
  //       data: [accounting.totalExpenses || 0],
  //     },
  //   ],
  //   options: {
  //     chart: {
  //       type: "bar",
  //       height: 350,
  //       toolbar: { show: false },
  //     },
  //     plotOptions: {
  //       bar: {
  //         horizontal: false,
  //         columnWidth: "55%",
  //       },
  //     },
  //     dataLabels: {
  //       enabled: false,
  //     },
  //     stroke: {
  //       show: true,
  //       width: 2,
  //       colors: ["transparent"],
  //     },
  //     xaxis: {
  //       categories: ["Current"],
  //     },
  //     yaxis: {
  //       title: {
  //         text: "Amount ($)",
  //       },
  //     },
  //     fill: {
  //       opacity: 1,
  //     },
  //     colors: ["#10b981", "#ef4444"],
  //     tooltip: {
  //       y: {
  //         formatter: (val: number) => formatCurrency(val),
  //       },
  //     },
  //   },
  // };

  // // Chart data for Financial Overview
  // const financialOverviewChart = {
  //   series: [
  //     accounting.totalAssets || 0,
  //     accounting.totalLiabilities || 0,
  //     accounting.totalEquity || 0,
  //   ],
  //   options: {
  //     chart: {
  //       type: "donut",
  //       height: 350,
  //     },
  //     labels: ["Assets", "Liabilities", "Equity"],
  //     colors: ["#3b82f6", "#ef4444", "#10b981"],
  //     legend: {
  //       position: "bottom",
  //     },
  //     tooltip: {
  //       y: {
  //         formatter: (val: number) => formatCurrency(val),
  //       },
  //     },
  //   },
  // };

  // // Chart data for Monthly Revenue vs Expenses
  // const monthlyChart = {
  //   series: [
  //     {
  //       name: "Revenue",
  //       data: [financial.monthlyRevenue || 0],
  //     },
  //     {
  //       name: "Expenses",
  //       data: [financial.monthlyExpenses || 0],
  //     },
  //   ],
  //   options: {
  //     chart: {
  //       type: "bar",
  //       height: 350,
  //       toolbar: { show: false },
  //     },
  //     plotOptions: {
  //       bar: {
  //         horizontal: false,
  //         columnWidth: "55%",
  //       },
  //     },
  //     dataLabels: {
  //       enabled: false,
  //     },
  //     stroke: {
  //       show: true,
  //       width: 2,
  //       colors: ["transparent"],
  //     },
  //     xaxis: {
  //       categories: ["This Month"],
  //     },
  //     yaxis: {
  //       title: {
  //         text: "Amount ($)",
  //       },
  //     },
  //     fill: {
  //       opacity: 1,
  //     },
  //     colors: ["#10b981", "#ef4444"],
  //     tooltip: {
  //       y: {
  //         formatter: (val: number) => formatCurrency(val),
  //       },
  //     },
  //   },
  // };

  // // Chart data for Party Distribution
  // const partyDistributionChart = {
  //   series: [
  //     parties.totalCustomers || 0,
  //     parties.totalSuppliers || 0,
  //     parties.totalEmployees || 0,
  //   ],
  //   options: {
  //     chart: {
  //       type: "pie",
  //       height: 350,
  //     },
  //     labels: ["Customers", "Suppliers", "Employees"],
  //     colors: ["#3b82f6", "#f59e0b", "#8b5cf6"],
  //     legend: {
  //       position: "bottom",
  //     },
  //     tooltip: {
  //       y: {
  //         formatter: (val: number) => formatNumber(val),
  //       },
  //     },
  //   },
  // };

  // const statsCards = [
  //   // Document Statistics
  //   {
  //     title: "Total Documents",
  //     value: formatNumber(documents.total || 0),
  //     icon: FileText,
  //     color: "bg-blue-500",
  //     change: null,
  //   },
  //   {
  //     title: "Documents Today",
  //     value: formatNumber(documents.today || 0),
  //     icon: Activity,
  //     color: "bg-green-500",
  //     change: null,
  //   },
  //   {
  //     title: "Documents This Month",
  //     value: formatNumber(documents.thisMonth || 0),
  //     icon: Calendar,
  //     color: "bg-purple-500",
  //     change: null,
  //   },
  //   {
  //     title: "Total Revenue (Documents)",
  //     value: formatCurrency(documents.totalRevenue || 0),
  //     icon: DollarSign,
  //     color: "bg-emerald-500",
  //     change: null,
  //   },
  //   {
  //     title: "Total Paid",
  //     value: formatCurrency(documents.totalPaid || 0),
  //     icon: CreditCard,
  //     color: "bg-teal-500",
  //     change: null,
  //   },
  //   {
  //     title: "Outstanding Balance",
  //     value: formatCurrency(documents.outstandingBalance || 0),
  //     icon: Receipt,
  //     color: "bg-orange-500",
  //     change: null,
  //   },
  //   // Party Statistics
  //   {
  //     title: "Total Customers",
  //     value: formatNumber(parties.totalCustomers || 0),
  //     icon: Users,
  //     color: "bg-indigo-500",
  //     change: null,
  //   },
  //   {
  //     title: "Total Suppliers",
  //     value: formatNumber(parties.totalSuppliers || 0),
  //     icon: Building2,
  //     color: "bg-amber-500",
  //     change: null,
  //   },
  //   {
  //     title: "Total Employees",
  //     value: formatNumber(parties.totalEmployees || 0),
  //     icon: Users,
  //     color: "bg-violet-500",
  //     change: null,
  //   },
  //   {
  //     title: "Accounts Receivable",
  //     value: formatCurrency(parties.accountsReceivable || 0),
  //     icon: TrendingUp,
  //     color: "bg-green-600",
  //     change: null,
  //   },
  //   {
  //     title: "Accounts Payable",
  //     value: formatCurrency(parties.accountsPayable || 0),
  //     icon: TrendingDown,
  //     color: "bg-red-600",
  //     change: null,
  //   },
  //   // Accounting Statistics
  //   {
  //     title: "Total Assets",
  //     value: formatCurrency(accounting.totalAssets || 0),
  //     icon: Wallet,
  //     color: "bg-blue-600",
  //     change: null,
  //   },
  //   {
  //     title: "Total Liabilities",
  //     value: formatCurrency(accounting.totalLiabilities || 0),
  //     icon: Receipt,
  //     color: "bg-red-500",
  //     change: null,
  //   },
  //   {
  //     title: "Total Equity",
  //     value: formatCurrency(accounting.totalEquity || 0),
  //     icon: Building2,
  //     color: "bg-green-600",
  //     change: null,
  //   },
  //   {
  //     title: "Total Revenue (Accounting)",
  //     value: formatCurrency(accounting.totalRevenue || 0),
  //     icon: TrendingUp,
  //     color: "bg-emerald-600",
  //     change: null,
  //   },
  //   {
  //     title: "Total Expenses",
  //     value: formatCurrency(accounting.totalExpenses || 0),
  //     icon: TrendingDown,
  //     color: "bg-rose-600",
  //     change: null,
  //   },
  //   {
  //     title: "Net Income",
  //     value: formatCurrency(accounting.netIncome || 0),
  //     icon: Calculator,
  //     color: accounting.netIncome >= 0 ? "bg-green-600" : "bg-red-600",
  //     change: null,
  //   },
  //   {
  //     title: "Active Accounts",
  //     value: formatNumber(accounting.activeAccounts || 0),
  //     icon: FileText,
  //     color: "bg-cyan-500",
  //     change: null,
  //   },
  //   {
  //     title: "Journal Entries Today",
  //     value: formatNumber(accounting.journalEntriesToday || 0),
  //     icon: Activity,
  //     color: "bg-pink-500",
  //     change: null,
  //   },
  //   // Financial Overview
  //   {
  //     title: "Cash Balance",
  //     value: formatCurrency(financial.cashBalance || 0),
  //     icon: Wallet,
  //     color: "bg-green-500",
  //     change: null,
  //   },
  //   {
  //     title: "Monthly Revenue",
  //     value: formatCurrency(financial.monthlyRevenue || 0),
  //     icon: TrendingUp,
  //     color: "bg-emerald-500",
  //     change: null,
  //   },
  //   {
  //     title: "Monthly Expenses",
  //     value: formatCurrency(financial.monthlyExpenses || 0),
  //     icon: TrendingDown,
  //     color: "bg-red-500",
  //     change: null,
  //   },
  // ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome back!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your notary business today.
        </p>
      </div>

      {/* Statistics Cards Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div> */}

      {/* Charts Section */}

      {/* Revenue vs Expenses Chart */}
      {/* Financial Overview (Assets, Liabilities, Equity) */}
      {/* Monthly Revenue vs Expenses */}
      {/* Party Distribution */}
      {/* 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue vs Expenses
          </h3>
          <Chart
            options={revenueExpensesChart.options as any}
            series={revenueExpensesChart.series}
            type="bar"
            height={350}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Financial Overview
          </h3>
          <Chart
            options={financialOverviewChart.options as any}
            series={financialOverviewChart.series}
            type="donut"
            height={350}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Revenue vs Expenses
          </h3>
          <Chart
            options={monthlyChart.options as any}
            series={monthlyChart.series}
            type="bar"
            height={350}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Party Distribution
          </h3>
          <Chart
            options={partyDistributionChart.options as any}
            series={partyDistributionChart.series}
            type="pie"
            height={350}
          />
        </div>
      </div> */}
    </div>
  );
}
