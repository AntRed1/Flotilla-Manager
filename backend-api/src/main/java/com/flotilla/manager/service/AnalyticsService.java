/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.flotilla.manager.service;

import com.flotilla.manager.dto.response.AnalyticsResponse;
import com.flotilla.manager.entity.User;

/**
 *
 * @author anjrojas
 */
public interface AnalyticsService {

    AnalyticsResponse.CyclesReport getCyclesReport(User user, int months);

    AnalyticsResponse.StationsReport getStationsReport(User user, String cycleId);

    AnalyticsResponse.GlobalSummary getGlobalSummary(User user);
}
