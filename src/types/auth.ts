import * as Yup from "yup";

export const SignInSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("No password provided."),
});

export const SignUpSchema = Yup.object().shape({
  name: Yup.string().max(100, "Too Long!").required("First name is Required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  age: Yup.number(),
  village: Yup.string().required("Village is required"),
  country: Yup.string().required("Country is required"),
  language: Yup.string().required("Language is required"),
  password: Yup.string().required("No password provided."),
  confirmPassword: Yup.string().required("No password provided."),
});
