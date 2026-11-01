package com.gosafe.gosafe_backend.verification;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** Fora do perfil dev e dos testes, as rotas da verificação simulada não existem. */
@SpringBootTest(properties = "gosafe.verification.simulated-enabled=false")
class VerificationDisabledTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void routesAreNotRegistered() {
        assertTrue(context.getBeansOfType(VerificationController.class).isEmpty());
    }
}
