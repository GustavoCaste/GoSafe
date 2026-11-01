/** Ações das telas: todas passam pela API. */
export {
  apiCheckIn as doCheckIn,
  apiCreateComment as addComment,
  apiCreateNotice as addNotice,
  apiCreatePlace as addPlace,
  apiCreateReport as addReport,
  apiEnterAsGuest as enterAsGuest,
  apiGeocode as geocodeAddress,
  apiLogin as login,
  apiLogout as logout,
  apiRegister as register,
  apiRemoveComment as deleteComment,
  apiRemoveNotice as deleteNotice,
  apiToggleFavorite as setFavorite,
  apiUpdateName as updateName,
} from './api';
