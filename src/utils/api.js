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
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд

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
      return true; // для DELETE часто возвращают 204
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
export const fetchTasks = async (startDate, endDate) => {
  const user = getCurrentUser();
  
  if (!user || !user.id) {
    console.log('❌ Нет авторизованного пользователя или отсутствует ID');
    return {};
  }
  
  const dateFormatter = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const params = new URLSearchParams({
    date_from: dateFormatter(startDate),
    date_to: dateFormatter(endDate),
    user_id: user.id
  }).toString();

  try {
    const url = `/tasks?${params}`;
    console.log('🔍 Запрос задач для пользователя:', user.id, 'URL:', url);
    
    const data = await apiFetch(url);
    console.log('📦 Полученные данные (RAW):', data);
    console.log('📦 Тип данных:', typeof data);
    console.log('📦 Это массив?', Array.isArray(data));
    
    let tasksArray = [];
    
    // Проверяем разные варианты ответа сервера
    if (Array.isArray(data)) {
      // Если сервер вернул массив задач
      console.log('✅ Сервер вернул массив задач, длина:', data.length);
      tasksArray = data;
    } 
    else if (data && data.tasks && Array.isArray(data.tasks)) {
      // Если сервер вернул объект с полем tasks
      console.log('✅ Сервер вернул объект с полем tasks, длина:', data.tasks.length);
      tasksArray = data.tasks;
    }
    else if (data && typeof data === 'object') {
      // Если сервер вернул объект, возможно ключи - это даты
      console.log('⚠️ Нестандартный формат ответа, пробуем обработать как объект');
      // Возможно, ответ уже сгруппирован
      return data;
    }
    else {
      console.log('⚠️ Неизвестный формат ответа:', data);
      return {};
    }
    
    console.log('📋 Всего задач получено:', tasksArray.length);
    
    // Группируем задачи по датам
    const groupedTasks = {};
    
    tasksArray.forEach(task => {
      console.log(`📌 Обработка задачи #${task.id}:`, {
        title: task.title,
        task_date: task.task_date,
        due_time: task.due_time
      });
      
      let taskDate = null;
      
      // Определяем дату задачи
      if (task.task_date) {
        if (typeof task.task_date === 'string') {
          // Если строка, берем первые 10 символов (YYYY-MM-DD)
          taskDate = task.task_date.slice(0, 10);
        } else if (task.task_date instanceof Date) {
          const date = task.task_date;
          taskDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
      } 
      else if (task.due_time && typeof task.due_time === 'string') {
        // Если есть due_time, берем из него дату
        taskDate = task.due_time.slice(0, 10);
      }
      
      if (!taskDate) {
        console.log(`⚠️ У задачи ${task.id} нет даты, пропускаем`);
        return;
      }
      
      console.log(`✅ Задача ${task.id} отнесена к дате: ${taskDate}`);
      
      if (!groupedTasks[taskDate]) {
        groupedTasks[taskDate] = [];
      }
      groupedTasks[taskDate].push(task);
    });
    
    // Сортируем задачи по времени
    for (const date in groupedTasks) {
      groupedTasks[date].sort((a, b) => {
        const timeA = a.due_time ? new Date(`2000-01-01T${a.due_time}`) : 0;
        const timeB = b.due_time ? new Date(`2000-01-01T${b.due_time}`) : 0;
        return timeA - timeB;
      });
    }
    
    console.log('✅ Сгруппированные задачи по датам:', Object.keys(groupedTasks));
    console.log('🎯 Пример сгруппированных задач:', groupedTasks);
    
    return groupedTasks;
    
  } catch (error) {
    console.error("❌ Ошибка при получении задач:", error);
    return {};
  }
};
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
      user_ids: [user.id],
    };

    console.log('[createTask] Отправляем:', formattedData);

    const response = await apiFetch('/tasks', {
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
    const formattedData = {
      title: taskData.title ?? null,
      description: taskData.description ?? null,
      status: taskData.status !== undefined ? taskData.status : null,  // ✅ правильная обработка false
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null,
      priority: taskData.priority ?? null,
    };

    console.log(`[updateTask #${taskId}] Отправляем:`, formattedData);

    return await apiFetch(`/tasks/${taskId}`, {
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
    return await apiFetch(`/tasks/${taskId}`);
  } catch (error) {
    console.error("Ошибка при получении задачи:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────

export const deleteTask = async (taskId) => {
  try {
    await apiFetch(`/tasks/${taskId}`, {
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

    const data = await apiFetch(`/tasks/search/?${params}`);
    return Array.isArray(data) ? data : (data?.tasks || []);
  } catch (error) {
    console.error("Ошибка при поиске задач:", error);
    return [];
  }
};

// ────────────────────────────────────────────────

export const createUser = async (userData) => {
  try {
    return await apiFetch('/users', {  // Исправлено: /user -> /users
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
    const encodedPassword = encodeURIComponent(userData.password);

    const data = await apiFetch(
      `/users/auth?login=${encodedLogin}&password=${encodedPassword}` // Исправлено: /user/user/auth -> /users/auth
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

export const getUserById = async (userId) => {  // Добавлена новая функция
  try {
    return await apiFetch(`/users/${userId}`);
  } catch (error) {
    console.error("Ошибка при получении пользователя:", error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    return await apiFetch(`/users/${userId}`, {  // Исправлено: /user -> /users
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {  // Добавлена новая функция
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
      method: 'POST',
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