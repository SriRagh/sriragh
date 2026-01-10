package com.innovan.roombooking.service;

import com.innovan.roombooking.dto.RoomBookingDto;
import com.innovan.roombooking.dto.RoomBookingDtoN;
import com.innovan.roombooking.dto.RoomsDto;
import com.innovan.roombooking.model.Rooms;
import com.innovan.roombooking.repository.RoomRepository;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<RoomBookingDto> getAllRoomBookings() {
        List<Rooms> rooms = roomRepository.findAll();
        long maintenanceCount = rooms
            .stream()
            .filter(r -> "Y".equalsIgnoreCase(r.getMaintenance()))
            .count();
        long availableCount = Math.subtractExact(rooms.size(), maintenanceCount);
        return rooms
            .stream()
            .map(room -> new RoomBookingDto(availableCount, maintenanceCount, rooms.size()))
            .toList();
    }

    public List<RoomBookingDtoN> getAvailableRooms() {
        return roomRepository.getRooms();
    }

    public Rooms createRooms(RoomsDto roomsDto) {
        Rooms room = new Rooms();
        room.setRoomName(roomsDto.roomName());
        room.setCapacity(roomsDto.capacity());
        room.setEquipments(roomsDto.equipments());
        room.setMaintenance(roomsDto.maintenance());

        return roomRepository.save(room);
    }

    public Rooms updateRoom(Long roomId, RoomsDto roomsDto) {
        Optional<Rooms> optionalRoom = roomRepository.findById(roomId);
        if (optionalRoom.isEmpty()) {
            throw new RuntimeException("Room not found with ID: " + roomId);
        }

        Rooms room = optionalRoom.get();
        room.setRoomName(roomsDto.roomName());
        room.setMaintenance(roomsDto.maintenance());
        room.setCapacity(roomsDto.capacity());
        room.setEquipments(roomsDto.equipments());

        return roomRepository.save(room);
    }

    public List<RoomsDto> getAllRooms() {
        List<Rooms> rooms = roomRepository.findAll();

        return rooms
            .stream()
            .map(room ->
                new RoomsDto(
                    room.getRoomId(),
                    room.getRoomName(),
                    room.getMaintenance(),
                    room.getCapacity(),
                    room.getEquipments(),
                    room.getLocation(),
                    room.getStatus()
                )
            )
            .collect(Collectors.toList());
    }

    public List<Rooms> getAllActiveRooms() {
        return roomRepository.findByStatus("Active");
    }

    public boolean deleteRooms(Long roomId) {
        Optional<Rooms> roomOpt = roomRepository.findById(roomId);
        if (roomOpt.isPresent()) {
            Rooms room = roomOpt.get();
            room.setStatus("Inactive");
            roomRepository.save(room);
            return true;
        }
        return false;
    }
}
