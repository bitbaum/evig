'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

interface AddCustomTaskRowProps {
  teamMembers: Array<{ id: string; name: string }>;
  adding: boolean;
  onAdd: (description: string, assignee: { id: string; name: string } | null) => Promise<boolean>;
}

export function AddCustomTaskRow({ teamMembers, adding, onAdd }: AddCustomTaskRowProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const submit = async () => {
    const member = teamMembers.find((m) => m.id === assigneeId);
    const ok = await onAdd(description, member ? { id: member.id, name: member.name } : null);
    if (ok) {
      setDescription('');
      setAssigneeId('');
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-action hover:text-action h-auto px-0 bg-transparent hover:bg-transparent"
      >
        <Plus className="w-4 h-4" />
        Aufgabe ergänzen — etwas wurde nicht erkannt?
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && description.trim() && !adding) submit();
          }}
          placeholder="Was ist zu tun?"
          className="flex-1"
          autoFocus
        />
        <Select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="sm:w-48"
          aria-label="Zuständige Person"
        >
          <option value="">— Niemand zugewiesen —</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={submit}
          disabled={adding || !description.trim()}
          className="gap-1.5"
        >
          {adding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Aufgabe erstellen
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="text-text-tertiary"
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
