package com.flotilla.manager.service;

import com.flotilla.manager.dto.request.ConfigRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.User;

public interface ConfigService {

    AppResponse.ConfigDto getConfig(User user);

    AppResponse.ConfigDto updateConfig(User user, ConfigRequest.Update request);
}
