// src/utils/api.js

const BASE_URL = 'http://localhost:8000/api/v1';

// Единая функция для всех запросов с таймаутом и обработкой ошибок
const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errData = await response.json();
        errorMessage = errData.message || errorMessage;
      } catch {}
      throw new Error(`Ошибка ${response.status}: ${errorMessage}`);
    }

    if (response.status === 204) {
      return true;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/plain')) {
      return response.text();
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Запрос превысил время ожидания (15 сек)');
    }
    console.error(`Ошибка API (${url}):`, error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  } catch (error) {
    console.error('Ошибка при получении текущего пользователя:', error);
    return null;
  }
};

// ────────────────────────────────────────────────

const dateFormatter = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fetchTasks = async (startDate, endDate) => {
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    console.log('❌ Нет авторизованного пользователя');
    return {};
  }

  const params = new URLSearchParams({
    date_from: dateFormatter(startDate),
    date_to: dateFormatter(endDate),
    user_id: user.id
  }).toString();

  try {
    const url = `/task?${params}`;
    console.log('🔍 Запрос задач для пользователя:', user.id);
    
    const data = await apiFetch(url);
    console.log('📦 Полученные данные:', data);
    
    if (!data) {
      console.log('⚠️ Нет данных');
      return {};
    }
    
    let tasksArray = [];
    if (data.tasks && Array.isArray(data.tasks)) {
      tasksArray = data.tasks;
    } else if (Array.isArray(data)) {
      tasksArray = data;
    } else {
      console.log('⚠️ Неизвестный формат:', data);
      return {};
    }
    
    console.log('📋 Всего задач:', tasksArray.length);
    
    const groupedTasks = {};
    
    tasksArray.forEach(task => {
      let taskDate = null;
      
      if (task.task_date) {
        if (typeof task.task_date === 'string') {
          taskDate = task.task_date.split('T')[0];
        } else if (task.task_date instanceof Date) {
          taskDate = dateFormatter(task.task_date);
        }
      }
      
      if (!taskDate) {
        console.log(`⚠️ У задачи ${task.id} нет даты, пропускаем`);
        return;
      }
      
      console.log(`📌 Задача ${task.id}: "${task.title}" на ${taskDate}`);
      
      if (!groupedTasks[taskDate]) {
        groupedTasks[taskDate] = [];
      }
      
      groupedTasks[taskDate].push({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        due_time: task.due_time,
        priority: task.priority,
        task_date: taskDate
      });
    });
    
    console.log('✅ Сгруппировано по датам:', Object.keys(groupedTasks));
    
    return groupedTasks;
    
  } catch (error) {
    console.error("❌ Ошибка при получении задач:", error);
    return {};
  }
};

// ────────────────────────────────────────────────

export const createTask = async (taskData) => {
  try {
    const user = getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error("Нет авторизованного пользователя");
    }

    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status ?? false,
      due_time: taskData.due_time || null,
      task_date: taskData.task_date || null, 
      priority: taskData.priority || null,
      user_id: user.id,
    };

    console.log('[createTask] Отправляем:', formattedData);

    const response = await apiFetch('/task', {
      method: 'POST',
      body: JSON.stringify(formattedData),
    });
    
    console.log('[createTask] Ответ:', response);
    return response;
  } catch (error) {
    console.error("Ошибка при создании задачи:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const updateTask = async (taskId, taskData) => {
  try {
    const formattedData = {};
    
    if (taskData.title !== undefined) {
      formattedData.title = taskData.title;
    }
    if (taskData.description !== undefined) {
      formattedData.description = taskData.description;
    }
    if (taskData.status !== undefined) {
      formattedData.status = taskData.status;
    }
    if (taskData.due_time !== undefined && taskData.due_time !== null && taskData.due_time !== '') {
      let timeStr = taskData.due_time;
      if (typeof timeStr === 'string' && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        formattedData.due_time = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      } else {
        formattedData.due_time = null;
      }
    } else {
      formattedData.due_time = null;
    }
    if (taskData.priority !== undefined) {
      formattedData.priority = taskData.priority;
    }

    console.log(`[updateTask #${taskId}] Отправляем:`, formattedData);

    return await apiFetch(`/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(formattedData),
    });
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const getTaskById = async (taskId) => {
  try {
    return await apiFetch(`/task/${taskId}`);
  } catch (error) {
    console.error("Ошибка при получении задачи:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const deleteTask = async (taskId) => {
  try {
    await apiFetch(`/task/${taskId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const searchTasksByTitle = async (query, limit = 10) => {
  try {
    const user = getCurrentUser();
    if (!user || !user.id) {
      return [];
    }

    const normalizedQuery = String(query || '').trim();
    if (!normalizedQuery) return [];

    const params = new URLSearchParams({
      user_id: String(user.id),
      query: normalizedQuery,
      limit: String(Math.min(Math.max(1, limit), 100)),
    }).toString();

    const data = await apiFetch(`/task/search/?${params}`);
    return Array.isArray(data) ? data : (data?.tasks || []);
  } catch (error) {
    console.error("Ошибка при поиске задач:", error);
    return [];
  }
};

// ────────────────────────────────────────────────

export const createUser = async (userData) => {
  try {
    return await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const loginUser = async (userData) => {
  try {
    const encodedLogin = encodeURIComponent(userData.login);
    const encodedPassword = encodeURIComponent(String(userData.password));

    const data = await apiFetch(
      `/users/user/auth?login=${encodedLogin}&password=${encodedPassword}`
    );

    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error("Ошибка при входе в систему:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const getUserById = async (userId) => {
  try {
    return await apiFetch(`/users/${userId}`);
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    return await apiFetch(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error("Ошибка при удалении пользователя:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const fetchUserParams = async (userId) => {
  try {
    let data = await apiFetch(`/params?user_id=${userId}`);
    
    if (typeof data === 'string' && data.startsWith('"') && data.endsWith('"')) {
      data = data.slice(1, -1);
    }
    return data;
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    console.error("Ошибка при получении параметров пользователя:", error);
    return null;
  }
};

export const updateUserParams = async (userId, description) => {
  try {
    return await apiFetch('/params', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, description }),
    });
  } catch (error) {
    console.error("Ошибка при обновлении параметров пользователя:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const getChatHistory = async (userId) => {
  try {
    return await apiFetch(`/chat/messages?user_id=${userId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error("Ошибка при получении истории чата:", error);
    throw error;
  }
};

export const generateChatMessage = async (userId, messageContent) => {
  try {
    return await apiFetch('/chat/generate', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message: messageContent }),
    });
  } catch (error) {
    console.error("Ошибка при генерации сообщения чата:", error);
    throw error;
  }
};