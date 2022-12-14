package com.example.demo.member.service;


import com.example.demo.member.Member;
import com.example.demo.member.repository.MemberRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class OAuthService extends DefaultOAuth2UserService {

    @Autowired
    private MemberRepository memberRepository;

    public OAuthService() {
        super();
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("{}", userRequest);
        OAuth2User oAuth2User = super.loadUser(userRequest);


        Member member = memberRepository.findByEmail(oAuth2User.getAttribute("email"));

        if (member == null) {

            registerNew(oAuth2User);
        }


        return new DefaultOAuth2User(oAuth2User.getAuthorities(), oAuth2User.getAttributes(), "email");

    }

    private void registerNew(OAuth2User userInfo) {
        Map<String, Object> attributes = userInfo.getAttributes();
        Member build = Member.builder()
                .email((String) attributes.get("email"))
                .name((String) attributes.get("name"))
                .role("ROLE_USER")
                .build();

        memberRepository.save(build);
    }


}
