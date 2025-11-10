// API Base URL
const API_URL = '/api/tasks';

// State
let currentFilter = 'all';
let editingTaskId = null;

// DOM Elements
const tasksContainer = document.getElementById('tasksContainer');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const refreshBtn = document.getElementById('refreshBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Statistics elements
const statTotal = document.getElementById('statTotal');
const statInProgress = document.getElementById('statInProgress');
const statCompleted = document.getElementById('statCompleted');
const statOverdue = document.getElementById('statOverdue');

// Redis elements
const redisStatsBtn = document.getElementById('redisStatsBtn');
const redisModal = document.getElementById('redisModal');
const closeRedisModal = document.getElementById('closeRedisModal');
const refreshRedisStats = document.getElementById('refreshRedisStats');
const resetRedisStats = document.getElementById('resetRedisStats');
const redisBanner = document.getElementById('redisBanner');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    loadStats();
    initializeEventListeners();
});

// Event Listeners
function initializeEventListeners() {
    addTaskBtn.addEventListener('click', openAddTaskModal);
    closeModal.addEventListener('click', closeTaskModal);
    cancelBtn.addEventListener('click', closeTaskModal);
    taskForm.addEventListener('submit', handleFormSubmit);
    refreshBtn.addEventListener('click', () => {
        loadTasks();
        loadStats();
        showToast('Data refreshed!', 'success');
    });

    // Redis stats modal
    redisStatsBtn.addEventListener('click', openRedisStatsModal);
    closeRedisModal.addEventListener('click', closeRedisStatsModal);
    refreshRedisStats.addEventListener('click', loadRedisStats);
    resetRedisStats.addEventListener('click', resetRedisCache);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadTasks();
        });
    });

    // Close modal on backdrop click
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !taskModal.classList.contains('hidden')) {
            closeTaskModal();
        }
    });
}

// Load Tasks
async function loadTasks() {
    showLoading();

    try {
        let url = API_URL;
        if (currentFilter !== 'all') {
            url += `?status=${currentFilter}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displayTasks(data.data);
        } else {
            showToast('Failed to load tasks', 'error');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Error loading tasks', 'error');
    } finally {
        hideLoading();
    }
}

// Load Statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            statTotal.textContent = stats.total || 0;
            statInProgress.textContent = stats.in_progress || 0;
            statCompleted.textContent = stats.completed || 0;
            statOverdue.textContent = stats.overdue || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Display Tasks
function displayTasks(tasks) {
    console.log('Displaying tasks:', tasks.length, 'tasks'); // Debug log
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
    
    console.log('Tasks rendered:', tasksContainer.children.length); // Debug log
}

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300';

    const priorityColors = {
        low: 'priority-low',
        medium: 'priority-medium',
        high: 'priority-high'
    };

    const statusColors = {
        pending: 'status-pending',
        'in-progress': 'status-in-progress',
        completed: 'status-completed'
    };

    const priorityIcons = {
        low: 'fa-arrow-down',
        medium: 'fa-minus',
        high: 'fa-arrow-up'
    };

    const statusIcons = {
        pending: 'fa-clock',
        'in-progress': 'fa-spinner',
        completed: 'fa-check-circle'
    };

    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <h3 class="text-xl font-bold text-gray-800 flex-1">${escapeHtml(task.title)}</h3>
            <div class="flex items-center space-x-2 ml-4">
                <button onclick="editTask(${task.id})" class="text-blue-600 hover:text-blue-800 p-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTask(${task.id})" class="text-red-600 hover:text-red-800 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        ${task.description ? `<p class="text-gray-600 mb-4 line-clamp-3">${escapeHtml(task.description)}</p>` : ''}

        <div class="flex flex-wrap gap-2 mb-4">
            <span class="status-badge ${statusColors[task.status]}">
                <i class="fas ${statusIcons[task.status]} mr-1"></i>
                ${formatStatus(task.status)}
            </span>
            <span class="priority-badge ${priorityColors[task.priority]}">
                <i class="fas ${priorityIcons[task.priority]} mr-1"></i>
                ${capitalizeFirst(task.priority)} Priority
            </span>
        </div>

        <div class="flex items-center text-sm text-gray-500">
            <i class="fas fa-calendar mr-2"></i>
            <span class="${isOverdue ? 'text-red-600 font-semibold' : ''}">
                ${isOverdue ? '⚠️ Overdue: ' : ''}${dueDate}
            </span>
        </div>
    `;

    return card;
}

// Open Add Task Modal
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus-circle mr-2"></i>New Task';
    taskForm.reset();
    taskModal.classList.remove('hidden');
}

// Open Edit Task Modal
async function editTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();

        if (data.success) {
            editingTaskId = id;
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit mr-2"></i>Edit Task';
            
            document.getElementById('taskId').value = data.data.id;
            document.getElementById('taskTitle').value = data.data.title;
            document.getElementById('taskDescription').value = data.data.description || '';
            document.getElementById('taskStatus').value = data.data.status;
            document.getElementById('taskPriority').value = data.data.priority;
            document.getElementById('taskDueDate').value = data.data.due_date ? data.data.due_date.split('T')[0] : '';

            taskModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading task:', error);
        showToast('Error loading task details', 'error');
    }
}

// Close Task Modal
function closeTaskModal() {
    taskModal.classList.add('hidden');
    taskForm.reset();
    editingTaskId = null;
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        due_date: document.getElementById('taskDueDate').value || null
    };

    try {
        const url = editingTaskId ? `${API_URL}/${editingTaskId}` : API_URL;
        const method = editingTaskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.success) {
            showToast(editingTaskId ? 'Task updated successfully!' : 'Task created successfully!', 'success');
            closeTaskModal();
            loadTasks();
            loadStats();
        } else {
            showToast(data.message || 'Failed to save task', 'error');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Error saving task', 'error');
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('Task deleted successfully!', 'success');
            loadTasks();
            loadStats();
        } else {
            showToast('Failed to delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Error deleting task', 'error');
    }
}

// Show Loading
function showLoading() {
    loadingState.classList.remove('hidden');
    tasksContainer.innerHTML = '';
    emptyState.classList.add('hidden');
}

// Hide Loading
function hideLoading() {
    loadingState.classList.add('hidden');
}

// Show Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    const icons = {
        success: 'fas fa-check-circle text-green-500',
        error: 'fas fa-exclamation-circle text-red-500',
        info: 'fas fa-info-circle text-blue-500',
        warning: 'fas fa-exclamation-triangle text-yellow-500'
    };

    const borderColors = {
        success: 'border-green-500',
        error: 'border-red-500',
        info: 'border-blue-500',
        warning: 'border-yellow-500'
    };

    toastIcon.className = icons[type] || icons.info;
    toastMessage.textContent = message;
    toast.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 max-w-sm z-50 border-l-4 ${borderColors[type]} toast-show`;

    setTimeout(() => {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Redis Statistics Functions
async function loadRedisStats() {
    try {
        const response = await fetch('/api/redis-stats');
        const result = await response.json();

        if (response.ok && result.success) {
            updateRedisStats(result.data); // Access nested data property
            showToast('Redis stats updated!', 'success');
        } else {
            showToast('Failed to load Redis stats', 'error');
        }
    } catch (error) {
        console.error('Error loading Redis stats:', error);
        showToast('Error loading Redis stats', 'error');
    }
}

function updateRedisStats(data) {
    console.log('Updating Redis stats:', data); // Debug log
    
    // Update metrics
    document.getElementById('redisHitRate').textContent = data.hit_rate || '0%';
    document.getElementById('redisHits').textContent = data.keyspace_hits?.toLocaleString() || '0';
    document.getElementById('redisMisses').textContent = data.keyspace_misses?.toLocaleString() || '0';
    document.getElementById('redisCommands').textContent = data.total_commands_processed?.toLocaleString() || '0';
    document.getElementById('redisCachedCount').textContent = `(${data.cached_keys || 0})`;

    // Update keys list
    const keysList = document.getElementById('redisKeysList');
    if (data.keys && data.keys.length > 0) {
        keysList.innerHTML = data.keys.map(key => `
            <div class="flex items-center justify-between bg-gray-50 px-3 py-2 rounded mb-1">
                <span class="text-sm font-mono text-gray-700">${escapeHtml(key)}</span>
                <i class="fas fa-key text-purple-500 text-xs"></i>
            </div>
        `).join('');
    } else {
        keysList.innerHTML = '<p class="text-gray-500 text-sm">No cached keys</p>';
    }
}

function openRedisStatsModal() {
    redisModal.classList.remove('hidden');
    loadRedisStats();
}

function closeRedisStatsModal() {
    redisModal.classList.add('hidden');
}

async function resetRedisCache() {
    if (!confirm('Are you sure you want to reset all Redis cache and statistics? This will clear all cached data.')) {
        return;
    }

    try {
        const response = await fetch('/api/redis-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            showToast('Redis cache reset successfully!', 'success');
            // Reload stats to show zeros
            setTimeout(() => {
                loadRedisStats();
                loadTasks(); // Reload tasks to repopulate cache
            }, 500);
        } else {
            showToast('Failed to reset Redis cache', 'error');
        }
    } catch (error) {
        console.error('Error resetting Redis cache:', error);
        showToast('Error resetting Redis cache', 'error');
    }
}

function showRedisBanner(fromCache) {
    if (fromCache) {
        const banner = document.getElementById('redisBanner');
        const message = document.getElementById('cacheMessage');
        message.textContent = '⚡ Data loaded from Redis cache - Lightning fast!';
        banner.classList.remove('hidden');
        
        setTimeout(() => {
            banner.classList.add('hidden');
        }, 3000);
    }
}

function closeRedisBanner() {
    document.getElementById('redisBanner').classList.add('hidden');
}

function formatStatus(status) {
    return status.split('-').map(capitalizeFirst).join(' ');
}

// Make functions globally accessible
window.editTask = editTask;
window.deleteTask = deleteTask;
