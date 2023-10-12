import { toast } from "react-toastify";

export const toastError = (textData) =>
toast.error(textData, {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
});

export const toastProcess = (textData) =>
toast.info(textData, {
  toastId: 2,
  autoClose: 5000,
  position: "top-right",
  hideProgressBar: true,
  closeOnClick: true,
  draggable: true,
  isLoading: true,
  progress: undefined,
});

export const toastSuccess = (textData) =>
toast.success(textData, {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
});