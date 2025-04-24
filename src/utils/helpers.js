export function setButtonText(
  btn,
  isLoading,
  defaultText = "Save",
  loadingText = "Saving..."
) {
  if (isLoading) {
    btn.textContent = loadingText;
    btn.setAttribute("disabled", "true");
  } else {
    btn.textContent = defaultText;
    btn.removeAttribute("disabled");
  }
}
