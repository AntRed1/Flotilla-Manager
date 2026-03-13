package com.flotilla.manager.service;

import java.util.List;

import com.flotilla.manager.dto.request.StationRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;

public interface StationService {

    List<AppResponse.StationDto> getStations(User user);

    AppResponse.StationDto createStation(User user, StationRequest.Create request);

    AppResponse.StationDto updateStation(User user, Long id, StationRequest.Update request);

    void deleteStation(User user, Long id);
}
