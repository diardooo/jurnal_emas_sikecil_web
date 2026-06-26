import { create } from "zustand";
import { toast } from "sonner";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  getMe,
  groupByChild,
} from "@/lib/api-client";
import {
  habitCategories,
  mockChildren,
  mockGoals,
  mockGrowth,
  mockHabits,
  mockJournal,
  mockImmunizations,
  mockMilestones,
  mockNotifications,
  mockSleepLogs,
  mockTasks,
  mockTeeth,
  mockTodos,
  taskCategories,
} from "@/lib/mock-data";
import type {
  AppNotification,
  Category,
  Child,
  Goal,
  GrowthRecord,
  Habit,
  Immunization,
  ImmunizationStatus,
  JournalEntry,
  Milestone,
  MilestoneStatus,
  SleepLog,
  SubscriptionPlan,
  Task,
  TaskStatus,
  ToothRecord,
  TodoItem,
} from "@/lib/types";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Dashboard guide visibility is a per-device UI preference persisted in
 * localStorage (not server state) so a dismissed guide stays dismissed across
 * reloads. SSR-safe: defaults to shown when there's no window.
 */
const GUIDE_KEY = "je:show-guide";
const readGuidePref = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(GUIDE_KEY) !== "0";
};
const writeGuidePref = (show: boolean) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUIDE_KEY, show ? "1" : "0");
};
const persist = (p: Promise<unknown>) =>
  p.catch((e) =>
    toast.error("Gagal menyimpan", {
      description: e instanceof Error ? e.message : "Coba lagi.",
    }),
  );

/**
 * Resilient list fetch for hydrate(): a single failing or not-yet-migrated
 * endpoint (e.g. a new column/table before the DB migration is applied) must
 * not break the whole app load. Logs and degrades to an empty list. Identity
 * (`getMe`) and the gating `children` list stay strict on purpose.
 */
const safeList = <T>(label: string, p: Promise<T[]>): Promise<T[]> =>
  p.catch((e) => {
    console.warn(`[hydrate] gagal memuat "${label}", memakai data kosong:`, e);
    return [] as T[];
  });

function recomputeProgress(goal: Goal): Goal {
  if (goal.subGoals.length === 0) return goal;
  const done = goal.subGoals.filter((s) => s.done).length;
  return { ...goal, progress: Math.round((done / goal.subGoals.length) * 100) };
}

const sortGrowth = (a: GrowthRecord, b: GrowthRecord) =>
  a.ageMonths - b.ageMonths;

/** Newest entries first for the journal timeline. */
const sortJournal = (a: JournalEntry, b: JournalEntry) =>
  b.date.localeCompare(a.date);

/** Built-in defaults + persisted custom categories of one kind (deduped). */
const mergeCategories = (
  defaults: readonly string[],
  rows: Category[],
  kind: Category["kind"],
): string[] => {
  const out = [...defaults];
  for (const r of rows) {
    if (r.kind === kind && !out.includes(r.name)) out.push(r.name);
  }
  return out;
};

/** Build per-child milestone groups from the master list (for demo mode). */
function demoMilestones(): Record<string, Milestone[]> {
  const out: Record<string, Milestone[]> = {};
  for (const c of mockChildren) {
    out[c.id] = mockMilestones.map((m) => ({
      ...m,
      id: `${c.id}-${m.id}`,
      childId: c.id,
    }));
  }
  return out;
}

interface AppState {
  hydrated: boolean;
  demo: boolean;
  children: Child[];
  activeChildId: string;
  tasks: Task[];
  todos: TodoItem[];
  habits: Habit[];
  milestones: Record<string, Milestone[]>;
  goals: Goal[];
  notifications: AppNotification[];
  growth: Record<string, GrowthRecord[]>;
  immunizations: Record<string, Immunization[]>;
  teeth: Record<string, ToothRecord[]>;
  sleepLogs: Record<string, SleepLog[]>;
  journal: Record<string, JournalEntry[]>;
  taskCategories: string[];
  habitCategories: string[];
  plan: SubscriptionPlan;
  subscriptionId?: string;
  showGuide: boolean;

  hydrate: () => Promise<void>;
  hydrateDemo: () => void;

  setActiveChild: (id: string) => void;
  /** Resolves after the server write completes (await before navigating). */
  addChild: (child: Child) => Promise<void>;
  updateChild: (id: string, patch: Partial<Child>) => void;

  addGrowthRecord: (childId: string, record: GrowthRecord) => void;
  deleteGrowthRecord: (childId: string, id: string) => void;
  setImmunizationStatus: (
    childId: string,
    immunizationId: string,
    status: ImmunizationStatus,
  ) => void;
  addImmunization: (childId: string, imm: Immunization) => void;
  toggleTooth: (childId: string, toothId: string) => void;
  setToothDate: (childId: string, toothId: string, date: string) => void;
  addSleepLog: (childId: string, log: SleepLog) => void;
  addJournalEntry: (childId: string, entry: JournalEntry) => void;
  updateJournalEntry: (
    childId: string,
    id: string,
    patch: Partial<JournalEntry>,
  ) => void;
  deleteJournalEntry: (childId: string, id: string) => void;
  dismissGuide: () => void;
  setShowGuide: (show: boolean) => void;

  addTask: (task: Task) => void;
  addTaskCategory: (name: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;

  addTodo: (todo: TodoItem) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;

  addHabit: (habit: Habit) => void;
  addHabitCategory: (name: string) => void;
  checkInHabit: (id: string) => void;
  deleteHabit: (id: string) => void;

  setMilestoneStatus: (id: string, status: MilestoneStatus) => void;
  setMilestoneRegressed: (id: string, regressed: boolean) => void;

  addGoal: (goal: Goal) => void;
  toggleSubGoal: (goalId: string, subId: string) => void;

  markNotificationRead: (id: string) => void;
  markAllRead: () => void;

  setPlan: (plan: SubscriptionPlan) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  /** Run an API write — unless we're in demo mode (then it's local-only). */
  const save = (run: () => Promise<unknown>) => {
    if (get().demo) return;
    void persist(run());
  };

  return {
    hydrated: false,
    demo: false,
    children: [],
    activeChildId: "",
    tasks: [],
    todos: [],
    habits: [],
    milestones: {},
    goals: [],
    notifications: [],
    growth: {},
    immunizations: {},
    teeth: {},
    sleepLogs: {},
    journal: {},
    taskCategories: [...taskCategories],
    habitCategories: [...habitCategories],
    plan: "free",
    showGuide: true,

    hydrate: async () => {
      const [
        me,
        children,
        tasks,
        todos,
        habits,
        milestones,
        goals,
        notifications,
        growth,
        immunizations,
        teeth,
        sleep,
        journal,
        categories,
      ] = await Promise.all([
        getMe(),
        apiGet<Child[]>("children"),
        safeList("tasks", apiGet<Task[]>("tasks")),
        safeList("todos", apiGet<TodoItem[]>("todos")),
        safeList("habits", apiGet<Habit[]>("habits")),
        safeList("milestones", apiGet<Milestone[]>("milestones")),
        safeList("goals", apiGet<Goal[]>("goals")),
        safeList("notifications", apiGet<AppNotification[]>("notifications")),
        safeList("growth", apiGet<GrowthRecord[]>("growth")),
        safeList("immunizations", apiGet<Immunization[]>("immunizations")),
        safeList("teeth", apiGet<ToothRecord[]>("teeth")),
        safeList("sleep", apiGet<SleepLog[]>("sleep")),
        safeList("journal", apiGet<JournalEntry[]>("journal")),
        safeList("categories", apiGet<Category[]>("categories")),
      ]);

      const grouped = groupByChild(growth);
      for (const k of Object.keys(grouped)) grouped[k].sort(sortGrowth);

      set({
        hydrated: true,
        demo: false,
        plan: me.plan,
        subscriptionId: me.subscription?.id,
        children,
        activeChildId: children[0]?.id ?? "",
        tasks,
        todos,
        habits,
        milestones: groupByChild(milestones),
        goals,
        notifications,
        growth: grouped,
        immunizations: groupByChild(immunizations),
        teeth: groupByChild(teeth),
        sleepLogs: groupByChild(sleep),
        journal: groupByChild(journal),
        taskCategories: mergeCategories(taskCategories, categories, "task"),
        habitCategories: mergeCategories(habitCategories, categories, "habit"),
        showGuide: readGuidePref(),
      });
    },

    /** Load read-only sample data. No network; writes stay local (not saved). */
    hydrateDemo: () =>
      set({
        hydrated: true,
        demo: true,
        plan: "premium",
        showGuide: true,
        children: mockChildren,
        activeChildId: mockChildren[0].id,
        tasks: mockTasks,
        todos: mockTodos,
        habits: mockHabits,
        goals: mockGoals,
        notifications: mockNotifications,
        milestones: demoMilestones(),
        growth: mockGrowth,
        immunizations: mockImmunizations,
        teeth: mockTeeth,
        sleepLogs: mockSleepLogs,
        journal: mockJournal,
      }),

    setActiveChild: (id) => set({ activeChildId: id }),

    addChild: (child) => {
      const { id: _omit, ...payload } = child;
      set((s) => ({ children: [...s.children, child], activeChildId: child.id }));
      if (get().demo) return Promise.resolve();
      // Returns a promise (always resolves; errors toast via `persist`) so the
      // caller can await the create before navigating — see onboarding finish().
      return persist(
        apiPost<Child>("children", payload).then(async (real) => {
          // server seeds milestone/immunization/teeth templates → pull them in
          const [milestones, immunizations, teeth] = await Promise.all([
            apiGet<Milestone[]>("milestones"),
            apiGet<Immunization[]>("immunizations"),
            apiGet<ToothRecord[]>("teeth"),
          ]);
          set((s) => ({
            children: [...s.children.filter((c) => c.id !== child.id), real],
            activeChildId: real.id,
            milestones: groupByChild(milestones),
            immunizations: groupByChild(immunizations),
            teeth: groupByChild(teeth),
          }));
        }),
      ).then(() => undefined);
    },
    updateChild: (id, patch) => {
      set((s) => ({
        children: s.children.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
      save(() => apiPatch("children", id, patch));
    },

    addGrowthRecord: (childId, record) => {
      const temp: GrowthRecord = { ...record, id: `tmp-${Date.now()}` };
      set((s) => ({
        growth: {
          ...s.growth,
          [childId]: [...(s.growth[childId] ?? []), temp].sort(sortGrowth),
        },
      }));
      save(() =>
        apiPost<GrowthRecord>("growth", { ...record, childId }).then((real) =>
          set((s) => ({
            growth: {
              ...s.growth,
              [childId]: (s.growth[childId] ?? [])
                .map((r) => (r.id === temp.id ? real : r))
                .sort(sortGrowth),
            },
          })),
        ),
      );
    },
    deleteGrowthRecord: (childId, id) => {
      set((s) => ({
        growth: {
          ...s.growth,
          [childId]: (s.growth[childId] ?? []).filter((r) => r.id !== id),
        },
      }));
      save(() =>
        id.startsWith("tmp-") ? Promise.resolve() : apiDelete("growth", id),
      );
    },

    setImmunizationStatus: (childId, immunizationId, status) => {
      set((s) => ({
        immunizations: {
          ...s.immunizations,
          [childId]: (s.immunizations[childId] ?? []).map((im) =>
            im.id === immunizationId
              ? { ...im, status, date: status === "selesai" ? today() : im.date }
              : im,
          ),
        },
      }));
      save(() =>
        apiPatch("immunizations", immunizationId, {
          status,
          ...(status === "selesai" ? { date: today() } : {}),
        }),
      );
    },
    addImmunization: (childId, imm) => {
      const { id: _omit, ...payload } = imm;
      const temp = { ...imm, id: `tmp-${Date.now()}` };
      set((s) => ({
        immunizations: {
          ...s.immunizations,
          [childId]: [...(s.immunizations[childId] ?? []), temp].sort(
            (a, b) => a.ageMonths - b.ageMonths,
          ),
        },
      }));
      save(() =>
        apiPost<Immunization>("immunizations", { ...payload, childId }).then(
          (real) =>
            set((s) => ({
              immunizations: {
                ...s.immunizations,
                [childId]: (s.immunizations[childId] ?? []).map((im) =>
                  im.id === temp.id ? real : im,
                ),
              },
            })),
        ),
      );
    },
    toggleTooth: (childId, toothId) => {
      let next: ToothRecord | undefined;
      set((s) => ({
        teeth: {
          ...s.teeth,
          [childId]: (s.teeth[childId] ?? []).map((t) => {
            if (t.id !== toothId) return t;
            next = {
              ...t,
              erupted: !t.erupted,
              date: !t.erupted ? today() : undefined,
            };
            return next;
          }),
        },
      }));
      if (next)
        save(() =>
          apiPatch("teeth", toothId, {
            erupted: next!.erupted,
            date: next!.date ?? null,
          }),
        );
    },
    setToothDate: (childId, toothId, date) => {
      set((s) => ({
        teeth: {
          ...s.teeth,
          [childId]: (s.teeth[childId] ?? []).map((t) =>
            t.id === toothId ? { ...t, erupted: true, date } : t,
          ),
        },
      }));
      save(() => apiPatch("teeth", toothId, { erupted: true, date }));
    },
    addSleepLog: (childId, log) => {
      const { id: _omit, ...payload } = log;
      const temp = { ...log, id: `tmp-${Date.now()}` };
      set((s) => ({
        sleepLogs: {
          ...s.sleepLogs,
          [childId]: [...(s.sleepLogs[childId] ?? []), temp].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        },
      }));
      save(() =>
        apiPost<SleepLog>("sleep", { ...payload, childId }).then((real) =>
          set((s) => ({
            sleepLogs: {
              ...s.sleepLogs,
              [childId]: (s.sleepLogs[childId] ?? []).map((l) =>
                l.id === temp.id ? real : l,
              ),
            },
          })),
        ),
      );
    },
    addJournalEntry: (childId, entry) => {
      const { id: _omit, ...payload } = entry;
      const temp = { ...entry, id: `tmp-${Date.now()}` };
      set((s) => ({
        journal: {
          ...s.journal,
          [childId]: [temp, ...(s.journal[childId] ?? [])].sort(sortJournal),
        },
      }));
      save(() =>
        apiPost<JournalEntry>("journal", { ...payload, childId }).then((real) =>
          set((s) => ({
            journal: {
              ...s.journal,
              [childId]: (s.journal[childId] ?? [])
                .map((j) => (j.id === temp.id ? real : j))
                .sort(sortJournal),
            },
          })),
        ),
      );
    },
    updateJournalEntry: (childId, id, patch) => {
      set((s) => ({
        journal: {
          ...s.journal,
          [childId]: (s.journal[childId] ?? [])
            .map((j) => (j.id === id ? { ...j, ...patch } : j))
            .sort(sortJournal),
        },
      }));
      save(() =>
        id.startsWith("tmp-") ? Promise.resolve() : apiPatch("journal", id, patch),
      );
    },
    deleteJournalEntry: (childId, id) => {
      set((s) => ({
        journal: {
          ...s.journal,
          [childId]: (s.journal[childId] ?? []).filter((j) => j.id !== id),
        },
      }));
      save(() =>
        id.startsWith("tmp-") ? Promise.resolve() : apiDelete("journal", id),
      );
    },
    dismissGuide: () => {
      set({ showGuide: false });
      writeGuidePref(false);
    },
    setShowGuide: (show) => {
      set({ showGuide: show });
      writeGuidePref(show);
    },

    addTask: (task) => {
      const { id: _omit, ...payload } = task;
      set((s) => ({ tasks: [task, ...s.tasks] }));
      save(() =>
        apiPost<Task>("tasks", payload).then((real) =>
          set((s) => ({
            tasks: s.tasks.map((t) => (t.id === task.id ? real : t)),
          })),
        ),
      );
    },
    addTaskCategory: (name) => {
      if (get().taskCategories.includes(name)) return;
      set((s) => ({ taskCategories: [...s.taskCategories, name] }));
      save(() => apiPost("categories", { kind: "task", name }));
    },
    updateTask: (id, patch) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
      save(() => apiPatch("tasks", id, patch));
    },
    setTaskStatus: (id, status) => {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
      }));
      save(() => apiPatch("tasks", id, { status }));
    },
    deleteTask: (id) => {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      save(() =>
        id.startsWith("t-") ? Promise.resolve() : apiDelete("tasks", id),
      );
    },

    addTodo: (todo) => {
      const { id: _omit, ...payload } = todo;
      set((s) => ({ todos: [...s.todos, todo] }));
      save(() =>
        apiPost<TodoItem>("todos", payload).then((real) =>
          set((s) => ({
            todos: s.todos.map((t) => (t.id === todo.id ? real : t)),
          })),
        ),
      );
    },
    toggleTodo: (id) => {
      let done = false;
      set((s) => ({
        todos: s.todos.map((t) => {
          if (t.id !== id) return t;
          done = !t.done;
          return { ...t, done };
        }),
      }));
      save(() => apiPatch("todos", id, { done }));
    },
    deleteTodo: (id) => {
      set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
      save(() =>
        id.startsWith("d-") ? Promise.resolve() : apiDelete("todos", id),
      );
    },

    addHabit: (habit) => {
      const { id: _omit, ...payload } = habit;
      set((s) => ({ habits: [...s.habits, habit] }));
      save(() =>
        apiPost<Habit>("habits", payload).then((real) =>
          set((s) => ({
            habits: s.habits.map((h) => (h.id === habit.id ? real : h)),
          })),
        ),
      );
    },
    addHabitCategory: (name) => {
      if (get().habitCategories.includes(name)) return;
      set((s) => ({ habitCategories: [...s.habitCategories, name] }));
      save(() => apiPost("categories", { kind: "habit", name }));
    },
    checkInHabit: (id) => {
      let payload: { history: boolean[]; streak: number } | null = null;
      set((s) => ({
        habits: s.habits.map((h) => {
          if (h.id !== id) return h;
          const history = [...h.history];
          const last = history.length - 1;
          const already = history[last];
          history[last] = !already;
          const streak = already ? Math.max(0, h.streak - 1) : h.streak + 1;
          payload = { history, streak };
          return { ...h, history, streak };
        }),
      }));
      if (payload) save(() => apiPatch("habits", id, payload!));
    },
    deleteHabit: (id) => {
      set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
      save(() =>
        id.startsWith("h-") ? Promise.resolve() : apiDelete("habits", id),
      );
    },

    setMilestoneStatus: (id, status) => {
      const achievedAt =
        status === "bisa" ? new Date().toISOString() : undefined;
      set((s) => {
        const next: Record<string, Milestone[]> = {};
        for (const [cid, list] of Object.entries(s.milestones)) {
          next[cid] = list.map((m) =>
            m.id === id ? { ...m, status, achievedAt } : m,
          );
        }
        return { milestones: next };
      });
      save(() =>
        apiPatch("milestones", id, { status, achievedAt: achievedAt ?? null }),
      );
    },

    setMilestoneRegressed: (id, regressed) => {
      set((s) => {
        const next: Record<string, Milestone[]> = {};
        for (const [cid, list] of Object.entries(s.milestones)) {
          next[cid] = list.map((m) =>
            m.id === id ? { ...m, regressed } : m,
          );
        }
        return { milestones: next };
      });
      save(() => apiPatch("milestones", id, { regressed }));
    },

    addGoal: (goal) => {
      const { id: _omit, ...payload } = goal;
      set((s) => ({ goals: [goal, ...s.goals] }));
      save(() =>
        apiPost<Goal>("goals", payload).then((real) =>
          set((s) => ({
            goals: s.goals.map((g) => (g.id === goal.id ? real : g)),
          })),
        ),
      );
    },
    toggleSubGoal: (goalId, subId) => {
      let updated: Goal | undefined;
      set((s) => ({
        goals: s.goals.map((g) => {
          if (g.id !== goalId) return g;
          updated = recomputeProgress({
            ...g,
            subGoals: g.subGoals.map((sub) =>
              sub.id === subId ? { ...sub, done: !sub.done } : sub,
            ),
          });
          return updated;
        }),
      }));
      if (updated)
        save(() =>
          apiPatch("goals", goalId, {
            subGoals: updated!.subGoals,
            progress: updated!.progress,
          }),
        );
    },

    markNotificationRead: (id) => {
      set((s) => ({
        notifications: s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
      }));
      save(() => apiPatch("notifications", id, { read: true }));
    },
    markAllRead: () => {
      const unread = get().notifications.filter((n) => !n.read);
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
      }));
      save(() =>
        Promise.all(
          unread.map((n) => apiPatch("notifications", n.id, { read: true })),
        ),
      );
    },

    setPlan: (plan) => {
      set({ plan });
      const subId = get().subscriptionId;
      if (subId) save(() => apiPatch("subscriptions", subId, { plan }));
    },
  };
});
