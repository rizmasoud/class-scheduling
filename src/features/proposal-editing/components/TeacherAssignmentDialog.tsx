import React, { useState } from 'react';
import { Modal, Select, Button, Group, Stack } from '@mantine/core';
import { SchedulingProposal, Teacher, ProposalClassId, TeacherId } from '@/domain/models';
import { useAssignTeacher } from '../hooks/use-proposal-editing';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal;
  teachers: readonly Teacher[];
  initialClassId?: string | null;
}

export function TeacherAssignmentDialog({ opened, onClose, proposal, teachers, initialClassId }: Props) {
  const assignTeacher = useAssignTeacher(proposal.id);

  const [selectedClass, setSelectedClass] = useState<string | null>(initialClassId || null);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  React.useEffect(() => {
    if (opened) {
      const targetClassId = initialClassId || (proposal.classes && proposal.classes[0]?.id) || null;
      setSelectedClass(targetClassId);
      if (targetClassId) {
        const cls = proposal.classes?.find(c => c.id === targetClassId);
        if (cls?.teacherId) setSelectedTeacher(cls.teacherId);
        else setSelectedTeacher(null);
      }
    }
  }, [opened, initialClassId, proposal.classes]);

  const handleClassChange = (val: string | null) => {
    setSelectedClass(val);
    if (val) {
      const cls = proposal.classes?.find(c => c.id === val);
      if (cls?.teacherId) setSelectedTeacher(cls.teacherId);
      else setSelectedTeacher(null);
    } else {
      setSelectedTeacher(null);
    }
  };

  const handleClose = () => {
    if (assignTeacher.isPending) return;
    setSelectedClass(null);
    setSelectedTeacher(null);
    onClose();
  };

  const classes = proposal.classes || [];
  const classOptions = classes.map(c => ({ value: c.id, label: c.generatedName || c.customName || c.id }));
  const teacherOptions = teachers.map(t => ({ value: t.id, label: t.fullName }));

  const handleAction = () => {
    if (selectedClass && selectedTeacher) {
      assignTeacher.mutate(
        { classId: selectedClass as ProposalClassId, teacherId: selectedTeacher as TeacherId },
        { onSuccess: handleClose }
      );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={assignTeacher.isPending ? () => {} : handleClose}
      closeOnClickOutside={!assignTeacher.isPending}
      closeOnEscape={!assignTeacher.isPending}
      title="Assign Teacher"
      centered
    >
      <Stack gap="md">
        <Select 
          label="Class" 
          placeholder="Select Class" 
          data={classOptions} 
          value={selectedClass} 
          onChange={handleClassChange} 
          searchable
          disabled={assignTeacher.isPending}
        />
        <Select 
          label="Teacher" 
          placeholder="Select Teacher" 
          data={teacherOptions} 
          value={selectedTeacher} 
          onChange={setSelectedTeacher} 
          searchable 
          disabled={assignTeacher.isPending}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose} disabled={assignTeacher.isPending}>Cancel</Button>
          <Button onClick={handleAction} loading={assignTeacher.isPending} disabled={assignTeacher.isPending || !selectedClass || !selectedTeacher}>
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
