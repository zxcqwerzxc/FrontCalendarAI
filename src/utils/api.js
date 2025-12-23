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
    
    const groupedTasks = {};
    if (data && data.tasks) {
      data.tasks.forEach(task => {
        const taskDate = task.task_date ? new Date(task.task_date).toISOString().slice(0, 10) : 'no_date';
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
    const response = await fetch('http://localhost:8000/api/v1/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
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