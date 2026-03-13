package com.flotilla.manager.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.flotilla.manager.dto.request.ConfigRequest;
import com.flotilla.manager.dto.response.AppResponse;
import com.flotilla.manager.entity.CardConfig;
import com.flotilla.manager.entity.User;
import com.flotilla.manager.repository.CardConfigRepository;
import com.flotilla.manager.service.ConfigService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ConfigServiceImpl implements ConfigService {

    private final CardConfigRepository configRepository;

    @Override
    @Transactional(readOnly = true)
    public AppResponse.ConfigDto getConfig(User user) {
        CardConfig config = getOrCreateConfig(user);
        return AppResponse.ConfigDto.from(config);
    }

    @Override
    @Transactional
    public AppResponse.ConfigDto updateConfig(User user, ConfigRequest.Update request) {
        CardConfig config = getOrCreateConfig(user);

        if (request.cardName() != null) {
            config.setCardName(request.cardName().trim());
        }
        if (request.monthlyLimit() != null) {
            config.setMonthlyLimit(request.monthlyLimit());
        }
        if (request.cutoffStartDay() != null) {
            config.setCutoffStartDay(request.cutoffStartDay());
        }
        if (request.cutoffEndDay() != null) {
            config.setCutoffEndDay(request.cutoffEndDay());
        }
        if (request.rechargeDay() != null) {
            config.setRechargeDay(request.rechargeDay());
        }
        if (request.currency() != null) {
            config.setCurrency(request.currency().toUpperCase());
        }

        config = configRepository.save(config);
        return AppResponse.ConfigDto.from(config);
    }

    private CardConfig getOrCreateConfig(User user) {
        return configRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    CardConfig newConfig = CardConfig.builder().user(user).build();
                    return configRepository.save(newConfig);
                });
    }
}
