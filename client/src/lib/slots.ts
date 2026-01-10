const generateTimeSlots = () => {
  const slots = [];
  const startTime = 9 * 60; 
  const endTime = 18 * 60; 
  const interval = 30;

  for (let time = startTime; time < endTime; time += interval) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    );
  }
  return slots;
};

export const timeSlots = generateTimeSlots();
