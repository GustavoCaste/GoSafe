/** Ações das telas: todas passam pela API. */
export {
  apiCheckIn as doCheckIn,
  apiCreateComment as addComment,
  apiCreateNotice as addNotice,
  apiCreatePlace as addPlace,
  apiLogin as login,
  apiLogout as logout,
  apiRegister as register,
  apiRemoveComment as deleteComment,
  apiRemoveNotice as deleteNotice,
  apiToggleFavorite as setFavorite,
  apiUpdateName as updateName,
  apiVerify as verifyIdentity,
} from './api';
