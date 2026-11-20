import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Columns3,
  ExternalLink,
  GripVertical,
  Link2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useStudySync } from '../services/studySyncStore';
import type { TaskStatus } from '../types/studysync';
import { buildAvatarLookup } from '../utils/avatar';
import { Avatar } from './Avatar';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  'To Do': 'border-t-2 border-t-amber-400',
  'In Progress': 'border-t-2 border-t-indigo-600',
  Done: 'border-t-2 border-t-emerald-500',
};

export const WorkspacesView: React.FC = () => {
  const {
    currentUser,
    peers,
    workspaces,
    addWorkspaceTask,
    moveWorkspaceTask,
    deleteWorkspaceTask,
    addWorkspaceLink,
    removeWorkspaceLink,
    updateWorkspaceNotes,
    setActiveView,
  } = useStudySync();

  const [selectedWsId, setSelectedWsId] = useState<string>(workspaces[0]?.id || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const avatarMap = useMemo(() => buildAvatarLookup(currentUser, peers), [currentUser, peers]);

  const activeWorkspace =
    workspaces.find((w) => w.id === selectedWsId) || workspaces[0] || null;

  const assigneeUidMap = useMemo(() => {
    const map = new Map<string, string>();
    if (activeWorkspace) {
      for (const m of activeWorkspace.members) {
        map.set(m.name.toLowerCase(), m.uid);
      }
    }
    return map;
  }, [activeWorkspace]);

  useEffect(() => {
    if (activeWorkspace) {
      setSelectedWsId(activeWorkspace.id);
      setNotesDraft(activeWorkspace.notes || '');
      setNewTaskAssignee(activeWorkspace.members[0]?.name || currentUser?.name || '');
    }
  }, [activeWorkspace?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!activeWorkspace) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <Columns3 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">No Team Workspaces Unlocked Yet</h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-2 mb-6">
          Join an open project from the Collaboration Noticeboard or accept a peer match request to unlock your shared Kanban task board and scratchpad.
        </p>
        <button
          type="button"
          onClick={() => setActiveView('board')}
          className="px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
        >
          Browse Collaboration Board
        </button>
      </div>
    );
  }

  const doneCount = activeWorkspace.tasks.filter((t) => t.status === 'Done').length;
  const totalCount = activeWorkspace.tasks.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addWorkspaceTask(activeWorkspace.id, newTaskTitle, newTaskAssignee);
    setNewTaskTitle('');
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
    await addWorkspaceLink(activeWorkspace.id, newLinkLabel, newLinkUrl);
    setNewLinkLabel('');
    setNewLinkUrl('');
  };

  const handleSaveNotes = async () => {
    await updateWorkspaceNotes(activeWorkspace.id, notesDraft);
  };

  const handleDropOnColumn = async (targetStatus: TaskStatus, e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverCol(null);
    setDraggedTaskId(null);
    if (!taskId) return;
    const existing = activeWorkspace.tasks.find((t) => t.id === taskId);
    if (!existing || existing.status === targetStatus) return;
    await moveWorkspaceTask(activeWorkspace.id, taskId, targetStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header & Workspace Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Workspaces</h1>
          <p className="text-sm text-slate-600 mt-1">
            Drag cards across columns or use arrows to update sprint tasks, shared links, and scratchpad notes.
          </p>
        </div>

        {workspaces.length > 1 && (
          <div>
            <label htmlFor="ws-selector" className="sr-only">
              Select Team Workspace
            </label>
            <select
              id="ws-selector"
              value={activeWorkspace.id}
              onChange={(e) => {
                const next = workspaces.find((w) => w.id === e.target.value);
                setSelectedWsId(e.target.value);
                if (next) setNotesDraft(next.notes || '');
              }}
              className="px-3.5 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg text-slate-900"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.projectTitle}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Workspace Banner with Live Team Avatar Stack & Sprint Progress */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{activeWorkspace.projectTitle}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex -space-x-2">
                {activeWorkspace.members.map((m) => (
                  <div key={m.uid} className="rounded-full ring-2 ring-white" title={`${m.name} (${m.role})`}>
                    <Avatar
                      name={m.name}
                      photoURL={avatarMap.get(m.uid)}
                      size="xs"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {activeWorkspace.members.map((m) => `${m.name} (${m.role})`).join(' · ')}
              </p>
            </div>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-700 shrink-0">
            <span className="font-semibold text-emerald-700">{progressPct}%</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span>
              {doneCount}/{totalCount} tasks done
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Add Task Form */}
      <form
        onSubmit={handleAddTask}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <input
          type="text"
          aria-label="New task title"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a deliverable or sprint task..."
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          aria-label="Assign task to teammate"
          value={newTaskAssignee}
          onChange={(e) => setNewTaskAssignee(e.target.value)}
          className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800"
        >
          {activeWorkspace.members.map((m) => (
            <option key={m.uid} value={m.name}>
              Assign: {m.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </form>

      {/* 3-Column Drag-and-Drop Kanban Board */}
      <section aria-label="Kanban task board" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {COLUMNS.map((colStatus, colIndex) => {
          const colTasks = activeWorkspace.tasks.filter((t) => t.status === colStatus);
          const isDropTarget = dragOverCol === colStatus;

          return (
            <div
              key={colStatus}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== colStatus) setDragOverCol(colStatus);
              }}
              onDragLeave={() => {
                if (dragOverCol === colStatus) setDragOverCol(null);
              }}
              onDrop={(e) => handleDropOnColumn(colStatus, e)}
              className={`bg-white border border-slate-200 ${COLUMN_ACCENT[colStatus]} rounded-2xl shadow-sm p-4 flex flex-col min-h-[260px] transition-all ${
                isDropTarget ? 'ring-2 ring-indigo-500/40 bg-indigo-50/30' : ''
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">{colStatus}</h3>
                <span className="text-xs font-mono font-medium text-slate-500 tabular-nums">
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
                  Drop task here or add above
                </div>
              ) : (
                <div className="space-y-3">
                  {colTasks.map((task) => {
                    const isDragging = draggedTaskId === task.id;
                    const assigneeUid = assigneeUidMap.get(task.assignee.toLowerCase());
                    const assigneePhoto = assigneeUid ? avatarMap.get(assigneeUid) : undefined;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(task.id);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverCol(null);
                        }}
                        className={`p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-xl space-y-2.5 cursor-grab active:cursor-grabbing hover:border-indigo-200 hover:shadow-xs transition-all ${
                          isDragging ? 'opacity-50 scale-[0.98]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            {task.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 pl-5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar name={task.assignee} photoURL={assigneePhoto} size="xs" />
                            <span className="text-xs text-slate-600 truncate">{task.assignee}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {colIndex > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveWorkspaceTask(
                                    activeWorkspace.id,
                                    task.id,
                                    COLUMNS[colIndex - 1]
                                  )
                                }
                                aria-label={`Move '${task.title}' back to ${COLUMNS[colIndex - 1]}`}
                                className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded cursor-pointer"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {colIndex < COLUMNS.length - 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  moveWorkspaceTask(
                                    activeWorkspace.id,
                                    task.id,
                                    COLUMNS[colIndex + 1]
                                  )
                                }
                                aria-label={`Move '${task.title}' to ${COLUMNS[colIndex + 1]}`}
                                className="p-1 text-indigo-600 hover:text-indigo-700 bg-white border border-slate-200 rounded cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteWorkspaceTask(activeWorkspace.id, task.id)}
                              aria-label={`Delete task '${task.title}'`}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Shared Scratchpad & Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-900">Shared Project Scratchpad</h3>
            <button
              type="button"
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              Save Notes
            </button>
          </div>
          <textarea
            aria-label="Shared project notes"
            rows={5}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Capture meeting times, jury Q&A prep, or slide structure..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#F8FAFC] border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">Shared Resource Links</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {activeWorkspace.links.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">
                Add Google Drive, Figma, or GitHub links for your team.
              </p>
            ) : (
              activeWorkspace.links.map((link) => (
                <div key={link.id} className="py-2.5 flex items-center justify-between gap-3">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => removeWorkspaceLink(activeWorkspace.id, link.id)}
                    aria-label={`Remove link '${link.label}'`}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddLink} className="pt-2 space-y-2 border-t border-slate-100">
            <input
              type="text"
              aria-label="Resource link label"
              value={newLinkLabel}
              onChange={(e) => setNewLinkLabel(e.target.value)}
              placeholder="Label (e.g., Pitch Deck Figma)"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                aria-label="Resource URL"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              >
                Add Link
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
