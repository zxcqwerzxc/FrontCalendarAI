export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
  } catch {
    return null;
  }
  return null;
};

export const fetchTasks = async (startDate, endDate) => {
  const user = getCurrentUser();
  
  // Если пользователь не авторизован, не загружаем задачи
  if (!user || !user.id) {
    console.log('No user authenticated, returning empty tasks');
    return {};
  }
  
  const dateFormatter = (date) => {
    return date.toISOString().split('T')[0];
  };

  const params = new URLSearchParams({
    date_from: dateFormatter(startDate),
    date_to: dateFormatter(endDate),
    user_id: user.id
  }).toString();

  try {
    const url = `http://localhost:8000/api/v1/tasks?${params}`;
    console.log('Fetching tasks for user:', user.id, 'URL:', url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Received tasks data:', data);
    
    const groupedTasks = {};
    if (data && data.tasks) {
      data.tasks.forEach(task => {
        // Фильтруем задачи по пользователю - пропускаем задачи других пользователей и задачи без user_id
        if (!task.user_id) {
          console.log(`Task ${task.id} has no user_id, skipping`);
          return; // Пропускаем задачи без user_id
        }
        if (task.user_id !== user.id) {
          console.log(`Skipping task ${task.id} - belongs to user ${task.user_id}, current user ${user.id}`);
          return; // Пропускаем задачи других пользователей
        }
        
        // Исправляем проблему со сдвигом дат: используем только дату без времени
        let taskDate = 'no_date';
        if (task.task_date) {
          // Если task_date уже в формате YYYY-MM-DD, используем его напрямую
          if (typeof task.task_date === 'string' && task.task_date.match(/^\d{4}-\d{2}-\d{2}/)) {
            taskDate = task.task_date.slice(0, 10);
          } else {
            // Иначе парсим дату и берем только дату без времени
            const date = new Date(task.task_date);
            // Используем локальные компоненты даты, чтобы избежать сдвига из-за часового пояса
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            taskDate = `${year}-${month}-${day}`;
          }
        }
        if (!groupedTasks[taskDate]) {
          groupedTasks[taskDate] = [];
        }
        groupedTasks[taskDate].push(task);
      });

      for (const date in groupedTasks) {
        groupedTasks[date].sort((a, b) => {
          const dateA = new Date(a.task_date);
          const dateB = new Date(b.task_date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          const createdA = new Date(a.created_at);
          const createdB = new Date(b.created_at);
          return createdA.getTime() - createdB.getTime();
        });
      }
    }
    return groupedTasks;

  } catch (error) {
    console.error("Ошибка при получении задач:", error);
    return {};
  }
};

export const createTask = async (taskData) => {
  try {
    const user = getCurrentUser();
    
    // Форматируем данные перед отправкой
    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status || null,
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null, // Преобразуем HH:mm в HH:mm:ss
      task_date: taskData.task_date || null, // Дата в формате YYYY-MM-DD
      priority: taskData.priority || null,
    };

    // Добавляем user_id только если пользователь авторизован
    if (user && user.id) {
      formattedData.user_id = user.id;
    }

    const response = await fetch('http://localhost:8000/api/v1/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при создании задачи:", error);
    throw error;
  }
};

export const updateTask = async (taskId, taskData) => {
  try {
    // Форматируем данные перед отправкой
    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status || null,
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null, // Преобразуем HH:mm в HH:mm:ss
      priority: taskData.priority || null,
    };

    const response = await fetch(`http://localhost:8000/api/v1/task/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при обновлении задачи:", error);
    throw error;
  }
};

export const getTaskById = async (taskId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/task/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при получении задачи:", error);
    throw error;
  }
};

export const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/task/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error("Ошибка при удалении задачи:", error);
    throw error;
  }
};

export const createUser = async (userData) => {
    try {
                const response = await fetch('http://localhost:8000/api/v1/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка при создании пользователя:", error);
        throw error;
    }
};

export const loginUser = async (userData) => {
    try {
        const encodedLogin = encodeURIComponent(userData.login);
        const encodedPassword = encodeURIComponent(userData.password);

        const response = await fetch(
            `http://localhost:8000/api/v1/user/user/auth?login=${encodedLogin}&password=${encodedPassword}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка при входе в систему:", error);
        throw error;
    }
};

export const updateUser = async (userId, userData) => {
    try {
        const response = await fetch(`http://localhost:8000/api/v1/user/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Ошибка при обновлении пользователя:", error);
        throw error;
    }
};
