import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@shared/schema";

export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];

export type TaskQuery = {
  status?: TaskStatus;
  caseId?: string;
  search?: string;
};

export type TaskPayload = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  caseId?: string | null;
  assignedTo?: string | null;
};

async function fetchTasks(params?: TaskQuery): Promise<Task[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.caseId) searchParams.set("caseId", params.caseId);
  if (params?.search) searchParams.set("search", params.search);

  const url = searchParams.size ? `/api/tasks?${searchParams.toString()}` : "/api/tasks";
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudieron obtener las tareas");
  }

  return res.json() as Promise<Task[]>;
}

async function createTask(input: TaskPayload): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudo crear la tarea");
  }

  return res.json() as Promise<Task>;
}

async function updateTask(id: string, input: Partial<TaskPayload>): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudo actualizar la tarea");
  }

  return res.json() as Promise<Task>;
}

async function deleteTask(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || "No se pudo eliminar la tarea");
  }

  return res.json() as Promise<{ success: boolean }>;
}

export function useTasksQuery(params?: TaskQuery) {
  const queryKey = params ? ["tasks", params] : ["tasks"];

  return useQuery<Task[], Error>({
    queryKey,
    queryFn: () => fetchTasks(params),
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, TaskPayload>({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { id: string; data: Partial<TaskPayload> }>({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
