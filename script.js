// Data storage
let transactions = JSON.parse(localStorage.getItem('financeData')) || [];

// Chart references
let expenseChart = null;
let trendChart = null;

// On page load
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('incomeDate').value = today;
    document.getElementById('expenseDate').value = today;
    
    updateDashboard();
    updateCharts();
    setupEventListeners();
});

// Event listeners
function setupEventListeners() {
    // Modal opening
    document.getElementById('addIncomeBtn').addEventListener('click', () => openModal('incomeModal'));
    document.getElementById('addExpenseBtn').addEventListener('click', () => openModal('expenseModal'));
    document.getElementById('quickIncome').addEventListener('click', () => openModal('incomeModal'));
    document.getElementById('quickExpense').addEventListener('click', () => openModal('expenseModal'));
    
    // Form submit
    document.getElementById('incomeForm').addEventListener('submit', handleIncomeSubmit);
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    
    // Export
    document.getElementById('exportData').addEventListener('click', exportToCSV);
    
    // Modal closing
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Modal operations
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Add income
function handleIncomeSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'income',
        description: document.getElementById('incomeDescription').value,
        amount: parseFloat(document.getElementById('incomeAmount').value),
        category: document.getElementById('incomeCategory').value,
        date: document.getElementById('incomeDate').value
    };
    
    transactions.push(transaction);
    saveData();
    updateDashboard();
    updateCharts();
    
    e.target.reset();
    document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    closeModal('incomeModal');
    
    showNotification('Income added successfully! 💚', 'success');
}

// Add expense
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value
    };
    
    transactions.push(transaction);
    saveData();
    updateDashboard();
    updateCharts();
    
    e.target.reset();
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    closeModal('expenseModal');
    
    showNotification('Expense added successfully! 💸', 'success');
}

// Update dashboard
function updateDashboard() {
    updateStats();
    updateRecentTransactions();
}

// Update statistics
function updateStats() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netSavings = totalIncome - totalExpense;
    
    const dates = [...new Set(transactions.map(t => t.date))];
    const dayCount = dates.length || 1;
    const dailyAverage = totalExpense / dayCount;
    
    document.getElementById('totalIncome').textContent = `$${totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('totalExpense').textContent = `$${totalExpense.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('netSavings').textContent = `$${netSavings.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('dailyAverage').textContent = `$${dailyAverage.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
}

// Update recent transactions
function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    
    if (transactions.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 2rem;">No transactions yet</div>';
        return;
    }
    
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-icon">
                <i class="fas fa-${transaction.type === 'income' ? 'arrow-up' : 'arrow-down'}"></i>
            </div>
            <div class="transaction-info">
                <div class="transaction-desc">${transaction.description}</div>
                <div class="transaction-category">${transaction.category}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </div>
        </div>
    `).join('');
}

// Update charts
function updateCharts() {
    updateTrendChart();
    updateExpenseChart();
}

// Trend chart
function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    if (transactions.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('No data available yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    const monthlyData = {};
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }
        
        monthlyData[monthKey][transaction.type] += transaction.amount;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expense);
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    });
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Income',
                data: incomeData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Expenses',
                data: expenseData,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US');
                        }
                    }
                }
            }
        }
    });
}

// Expense categories chart
function updateExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (expenseChart) {
        expenseChart.destroy();
    }
    
    const expenses = transactions.filter(t => t.type === 'expense');
    
    if (expenses.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('No expenses yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }
    
    const categoryTotals = {};
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
        '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: colors.slice(0, Object.keys(categoryTotals).length),
                borderWidth: 0,
                cutout: '60%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: $${context.parsed.toLocaleString('en-US', {minimumFractionDigits: 2})} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// CSV Export
function exportToCSV() {
    if (transactions.length === 0) {
        showNotification('No data to export!', 'error');
        return;
    }
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            t.date,
            t.type === 'income' ? 'Income' : 'Expense',
            t.category,
            `"${t.description}"`,
            t.amount
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `finance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV file downloaded! 📊', 'success');
}

// Save data
function saveData() {
    localStorage.setItem('financeData', JSON.stringify(transactions));
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 3000;
        font-weight: 600;
        font-family: Inter, sans-serif;
        transform: translateX(400px);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
