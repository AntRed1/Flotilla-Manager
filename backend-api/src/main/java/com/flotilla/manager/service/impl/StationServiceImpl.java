package com.flotilla.manager.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flotilla.manager.dto.request.StationRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.GasStation;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.exception.ConflictException;
import com.flotilla.manager.exception.ResourceNotFoundException;
import com.flotilla.manager.repository.GasStationRepository;
import com.flotilla.manager.service.StationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StationServiceImpl implements StationService {

    private final GasStationRepository stationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AppResponse.StationDto> getStations(User user) {
        return stationRepository.findAvailableForUser(user.getId())
                .stream()
                .map(AppResponse.StationDto::from)
                .toList();
    }

    @Override
    @Transactional
    public AppResponse.StationDto createStation(User user, StationRequest.Create request) {
        if (stationRepository.existsByNameAndUserId(request.name(), user.getId())) {
            throw new ConflictException("Ya existe una estación con ese nombre");
        }

        GasStation station = GasStation.builder()
                .user(user)
                .name(request.name().trim())
                .address(request.address() != null ? request.address().trim() : null)
                .zone(request.zone() != null ? request.zone().trim() : "Zona General")
                .province(request.province() != null ? request.province().trim() : null)
                .active(true)
                .build();

        station = stationRepository.save(station);
        return AppResponse.StationDto.from(station);
    }

    @Override
    @Transactional
    public AppResponse.StationDto updateStation(User user, Long id, StationRequest.Update request) {
        GasStation station = stationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Estación", id));

        if (request.name() != null) {
            station.setName(request.name().trim());
        }
        if (request.address() != null) {
            station.setAddress(request.address().trim());
        }
        if (request.zone() != null) {
            station.setZone(request.zone().trim());
        }
        if (request.province() != null) {
            station.setProvince(request.province().trim());
        }

        station = stationRepository.save(station);
        return AppResponse.StationDto.from(station);
    }

    @Override
    @Transactional
    public void deleteStation(User user, Long id) {
        GasStation station = stationRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Estación", id));
        // Soft delete
        station.setActive(false);
        stationRepository.save(station);
    }
}
