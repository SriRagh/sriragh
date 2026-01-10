package com.innovan.roombooking.controller;

import com.innovan.roombooking.dto.RoomBookingDto;
import com.innovan.roombooking.dto.RoomBookingDtoN;
import com.innovan.roombooking.dto.RoomsDto;
import com.innovan.roombooking.model.Rooms;
import com.innovan.roombooking.service.RoomService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping("/bookings")
    public ResponseEntity<RoomBookingDto> getRoomBookings() {
        List<RoomBookingDto> rooms = roomService.getAllRoomBookings();
        return ResponseEntity.ok(rooms.get(0));
    }

    @GetMapping("/availableRooms")
    public List<RoomBookingDtoN> getAvailableRooms() {
        return roomService.getAvailableRooms();
    }

    @PostMapping("/createRoom")
    public ResponseEntity<RoomsDto> createRoom(@RequestBody RoomsDto roomsDto) {
        Rooms createdRoom = roomService.createRooms(roomsDto);

        RoomsDto createdDto = new RoomsDto(
                createdRoom.getRoomId(),
                createdRoom.getRoomName(),
                createdRoom.getMaintenance(),
                createdRoom.getCapacity(),
                createdRoom.getEquipments(),
                createdRoom.getLocation(),
                createdRoom.getStatus());

        return ResponseEntity.status(HttpStatus.CREATED).body(createdDto);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Rooms>> getAllActiveRooms() {
        return ResponseEntity.ok(roomService.getAllActiveRooms());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteRoom(@PathVariable("id") Long roomId) {
        boolean deleted = roomService.deleteRooms(roomId);
        if (deleted) {
            return ResponseEntity.ok("Room marked as Inactive successfully");
        } else {
            return ResponseEntity.status(404).body("Room not found with id " + roomId);
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<RoomsDto> updateRoom(
            @PathVariable("id") Long roomId,
            @RequestBody RoomsDto roomsDto) {
        Rooms updatedRoom = roomService.updateRoom(roomId, roomsDto);
        RoomsDto updatedDto = new RoomsDto(
                updatedRoom.getRoomId(),
                updatedRoom.getRoomName(),
                updatedRoom.getMaintenance(),
                updatedRoom.getCapacity(),
                updatedRoom.getEquipments(),
                updatedRoom.getLocation(),
                updatedRoom.getStatus());

        return ResponseEntity.ok(updatedDto);
    }

    @GetMapping("/allRoomInfo")
    public ResponseEntity<List<RoomsDto>> getAllRooms() {
        List<RoomsDto> rooms = roomService.getAllRooms();
        return ResponseEntity.ok(rooms);
    }
}
