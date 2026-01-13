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
    console.log('No user authenticated or user ID missing, returning empty tasks');
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
    
    const groupedTasks = {};
    if (data && data.tasks) {
      data.tasks.forEach(task => {
        // Фильтруем задачи по пользователю - пропускаем задачи других пользователей и задачи без user_id
        // if (!task.user_id) {
        //   console.log(`Task ${task.id} has no user_id, skipping`);
        //   return; // Пропускаем задачи без user_id
        // }
        if (task.user_id && task.user_id !== user.id) { // Оставляем проверку для других пользователей, если user_id есть
          console.log(`Skipping task ${task.id} - belongs to user ${task.user_id}, current user ${user.id}`);
          return; // Пропускаем задачи других пользователей
        }
        
        let taskDate = 'no_date';
        if (task.task_time) { // Предпочитаем task_time, если доступен
            taskDate = task.task_time.slice(0, 10); // Извлекаем YYYY-MM-DD из task_time
        } else if (task.task_date) {
            // Если task_date уже в формате YYYY-MM-DD, используем его напрямую
            if (typeof task.task_date === 'string' && task.task_date.match(/^\d{4}-\d{2}-\d{2}/)) {
                taskDate = task.task_date.slice(0, 10);
            } else {
                // Иначе парсим дату в формате DD.MM.YYYY и берем только дату без времени
                const parts = task.task_date.split('.');
                if (parts.length === 3) {
                    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    taskDate = `${year}-${month}-${day}`;
                } else {
                    console.warn(`Неизвестный формат даты для задачи ${task.id}: ${task.task_date}. Попытка стандартного парсинга.`);
                    const date = new Date(task.task_date);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        taskDate = `${year}-${month}-${day}`;
                    } else {
                        console.error(`Не удалось распарсить дату для задачи ${task.id}: ${task.task_date}`);
                        taskDate = 'invalid_date'; 
                    }
                }
            }
        }

        if (!groupedTasks[taskDate]) {
          groupedTasks[taskDate] = [];
        }
        groupedTasks[taskDate].push(task);
      });

      for (const date in groupedTasks) {
        groupedTasks[date].sort((a, b) => {
          // Сортировка по task_time (хронологически)
          const timeA = new Date(a.task_time);
          const timeB = new Date(b.task_time);
          return timeA.getTime() - timeB.getTime();
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
    
    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status || null,
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null,
      task_date: taskData.task_date || null, 
      priority: taskData.priority || null,
    };

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
    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status || null,
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null,
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

// New API functions for user parameters (About Me section)
export const fetchUserParams = async (userId) => {
  try {
    const response = await fetch(`http://localhost:8000/api/v1/params?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      // Если ответ не OK, проверяем статус. Если 404 (не найдено), возвращаем пустую строку.
      // Это означает, что пользователь еще не сохранял описание.
      if (response.status === 404) {
        return null; 
      }
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    let data = await response.text(); // Бэкенд возвращает строку напрямую
    // Удаляем кавычки из строки, если они есть
    if (data.startsWith('"') && data.endsWith('"')) {
      data = data.slice(1, -1);
    }
    return data;
  } catch (error) {
    console.error("Ошибка при получении параметров пользователя:", error);
    return null;
  }
};

export const updateUserParams = async (userId, description) => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/params', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, description: description }), // Изменено с param_value на description
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при обновлении параметров пользователя:", error);
    throw error;
  }
};
