package com.pasadanow.FinalProject.security;

import com.pasadanow.FinalProject.model.Commuter;
import com.pasadanow.FinalProject.model.Driver;
import com.pasadanow.FinalProject.repository.CommuterRepository;
import com.pasadanow.FinalProject.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private CommuterRepository commuterRepo;

    @Autowired
    private DriverRepository driverRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        // check commuters first
        var commuter = commuterRepo.findByUsername(username);
        if (commuter.isPresent()) {
            Commuter c = commuter.get();
            return new org.springframework.security.core.userdetails.User(
                    c.getUsername(),
                    c.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_COMMUTER")));
        }

        // then check drivers
        var driver = driverRepo.findByUsername(username);
        if (driver.isPresent()) {
            Driver d = driver.get();
            return new org.springframework.security.core.userdetails.User(
                    d.getUsername(),
                    d.getPassword(),
                    List.of(new SimpleGrantedAuthority("ROLE_DRIVER")));
        }

        throw new UsernameNotFoundException("User not found: " + username);
    }
}