export const fetchTasks = async (startDate, endDate) => {
  const dateFormatter = (date) => {
    return date.toISOString().split('T')[0];
  };

  const params = new URLSearchParams({
    date_from: dateFormatter(startDate),
    date_to: dateFormatter(endDate),
  }).toString();

  try {
    const response = await fetch(`http://localhost:8000/api/v1/tasks?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Raw tasks from API:", data.tasks);
    
    const groupedTasks = {};
    if (data && data.tasks) {
      data.tasks.forEach(task => {
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
    // Форматируем данные перед отправкой
    const formattedData = {
      title: taskData.title || null,
      description: taskData.description || null,
      status: taskData.status || null,
      due_time: taskData.due_time ? `${taskData.due_time}:00` : null, // Преобразуем HH:mm в HH:mm:ss
      task_date: taskData.task_date || null, // Дата в формате YYYY-MM-DD
      priority: taskData.priority || null,
      // created_at не отправляем - бэкенд сам заполняет
    };

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