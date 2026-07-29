import React, { useState } from 'react';
import { Modal, Select, Button, Group, Stack, TextInput } from '@mantine/core';
import { SchedulingProposal, ProposalClassId } from '@/domain/models';
import { useChangeSchedule } from '../hooks/use-proposal-editing';

interface Props {
  opened: boolean;
  onClose: () => void;
  proposal: SchedulingProposal;
}

export function ScheduleEditorDialog({ opened, onClose, proposal }: Props) {
  const changeSchedule = useChangeSchedule(proposal.id);

  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [weekDay, setWeekDay] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const handleClose = () => {
    setSelectedClass(null);
    setWeekDay(null);
    setStartTime('');
    setEndTime('');
    onClose();
  };

  const classes = proposal.classes || [];
  const classOptions = classes.map(c => ({ value: c.id, label: c.generatedName || c.id }));
  
  const handleClassChange = (val: string | null) => {
    setSelectedClass(val);
    if (val) {
      const cls = classes.find(c => c.id === val);
      if (cls && cls.schedules && cls.schedules.length > 0) {
        setWeekDay(cls.schedules[0].weekDay);
        setStartTime(cls.schedules[0].startTime);
        setEndTime(cls.schedules[0].endTime);
      }
    }
  };

  const handleAction = () => {
    if (selectedClass && weekDay && startTime && endTime) {
      changeSchedule.mutate(
        { classId: selectedClass as ProposalClassId, weekDay, startTime, endTime },
        { onSuccess: handleClose }
      );
    }
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Edit Schedule" centered>
      <Stack gap="md">
        <Select 
          label="Class" 
          placeholder="Select Class" 
          data={classOptions} 
          value={selectedClass} 
          onChange={handleClassChange} 
          searchable 
        />
        <Select 
          label="Day of Week" 
          placeholder="Select Day" 
          data={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']} 
          value={weekDay} 
          onChange={setWeekDay} 
        />
        <Group grow>
          <TextInput label="Start Time" placeholder="HH:mm" value={startTime} onChange={(e) => setStartTime(e.currentTarget.value)} />
          <TextInput label="End Time" placeholder="HH:mm" value={endTime} onChange={(e) => setEndTime(e.currentTarget.value)} />
        </Group>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAction} loading={changeSchedule.isPending} disabled={!selectedClass || !weekDay || !startTime || !endTime}>
            Save Schedule
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
