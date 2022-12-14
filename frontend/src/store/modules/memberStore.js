import jwtDecode from "jwt-decode";
import router from "@/router";
import { login, findById, tokenRegeneration, logout } from "@/api/member";

const memberStore = {
  namespaced: true,
  state: {
    isLogin: false,
    isLoginError: false,
    userInfo: null,
    isValidToken: false,
  },
  getters: {
    checkUserInfo: function (state) {
      return state.userInfo;
    },
    checkToken: function (state) {
      return state.isValidToken;
    },
  },
  mutations: {
    SET_IS_LOGIN: (state, isLogin) => {
      state.isLogin = isLogin;
    },
    SET_IS_LOGIN_ERROR: (state, isLoginError) => {
      state.isLoginError = isLoginError;
    },
    SET_IS_VALID_TOKEN: (state, isValidToken) => {
      state.isValidToken = isValidToken;
    },
    SET_USER_INFO: (state, userInfo) => {
      state.isLogin = true;
      state.userInfo = userInfo;
    },
  },
  actions: {
    async userConfirm({ commit }, user) {
      await login(
        user,
        ({ data }) => {
          if (data.message === "success") {
            let accessToken = data["access-token"];
            let refreshToken = data["refresh-token"];
            // console.log("login success token created!!!! >> ", accessToken, refreshToken);
            commit("SET_IS_LOGIN", true);
            commit("SET_IS_LOGIN_ERROR", false);
            commit("SET_IS_VALID_TOKEN", true);
            sessionStorage.setItem("access-token", accessToken);
            sessionStorage.setItem("refresh-token", refreshToken);
          } else {
            commit("SET_IS_LOGIN", false);
            commit("SET_IS_LOGIN_ERROR", true);
            commit("SET_IS_VALID_TOKEN", false);
          }
        },
        (error) => {
          console.log(error);
        }
      );
    },
    async getUserInfo({ commit, dispatch }, token) {
      console.log(token);
      let decodeToken = jwtDecode(token.substring(7));

      // console.log("2. getUserInfo() decodeToken :: ", decodeToken);
      await findById(
        decodeToken.userid,
        (response) => {
          console.log(response);
          if (response.status === 200) {
            commit("SET_USER_INFO", response.data);
            // console.log("3. getUserInfo data >> ", data);
          } else {
            console.log("?????? ?????? ??????!!!!");
          }
        },
        async (error) => {
          console.log(
            "getUserInfo() error code [?????? ???????????? ?????? ?????????.] ::: ",
            error.response.status
          );
          commit("SET_IS_VALID_TOKEN", false);
          await dispatch("tokenRegeneration");
        }
      );
    },
    async tokenRegeneration({ commit, state }) {
      console.log(
        "?????? ????????? >> ?????? ?????? ?????? : {}",
        sessionStorage.getItem("access-token")
      );
      await tokenRegeneration(
        JSON.stringify(state.userInfo),
        ({ data }) => {
          if (data.message === "success") {
            let accessToken = data["access-token"];
            console.log("????????? ?????? >> ????????? ?????? : {}", accessToken);
            sessionStorage.setItem("access-token", accessToken);
            commit("SET_IS_VALID_TOKEN", true);
          }
        },
        async (error) => {
          // HttpStatus.UNAUTHORIZE(401) : RefreshToken ?????? ?????? >> ?????? ?????????!!!!
          if (error.response.status === 401) {
            console.log("?????? ??????");
            // ?????? ????????? ??? DB??? ????????? RefreshToken ??????.
            await logout(
              state.userInfo.userid,
              ({ data }) => {
                if (data.message === "success") {
                  console.log("???????????? ?????? ?????? ??????");
                } else {
                  console.log("???????????? ?????? ?????? ??????");
                }
                alert("RefreshToken ?????? ??????!!! ?????? ???????????? ?????????.");
                commit("SET_IS_LOGIN", false);
                commit("SET_USER_INFO", null);
                commit("SET_IS_VALID_TOKEN", false);
                router.push({ name: "login" });
              },
              (error) => {
                console.log(error);
                commit("SET_IS_LOGIN", false);
                commit("SET_USER_INFO", null);
              }
            );
          }
        }
      );
    },
    async userLogout({ commit }) {
      // await logout(
      //   userid,
      //   ({ data }) => {
      //     if (data.message === "success") {
      //       commit("SET_IS_LOGIN", false);
      //       commit("SET_USER_INFO", null);
      //       commit("SET_IS_VALID_TOKEN", false);
      //     } else {
      //       console.log("?????? ?????? ??????!!!!");
      //     }
      //   },
      //   (error) => {
      //     console.log(error);
      //   }
      // );

      commit("SET_IS_LOGIN", false);
      commit("SET_USER_INFO", null);
      commit("SET_IS_VALID_TOKEN", false);
    },
    async MemberLogin({ commit }, user) {
      await login(user, (response) => {
        let accessToken = response.headers.authorization;
        let refreshToken = response.headers.refresh;
        console.log(response);
        console.log(accessToken);
        console.log(response.data);
        commit("SET_IS_LOGIN", true);
        commit("SET_USER_INFO", response.data);
        commit("SET_IS_VALID_TOKEN", true);
        sessionStorage.setItem("access-token", accessToken);
        sessionStorage.setItem("refresh-token", refreshToken);
      }),
        (error) => {
          console.log(error);
        };
    },
    async redirectOAuth({ commit }, member) {
      commit("SET_IS_LOGIN", true);
      commit("SET_USER_INFO", { name: member.name, id: member.id });
      commit("SET_IS_VALID_TOKEN", true);

      sessionStorage.setItem("access-token", member.token);
      console.log(member);
      console.log(member.token);
      console.log(sessionStorage.getItem("access-token"));
    },
  },
};

export default memberStore;
