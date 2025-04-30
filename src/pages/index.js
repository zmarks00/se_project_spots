import "./index.css";
import { enableValidation, settings } from "../scripts/validation.js";
import { disableButton } from "../scripts/validation.js";
import { resetValidation } from "../scripts/validation.js";
import { setButtonText } from "../utils/helpers.js";
import Api from "../utils/Api.js";

let cardToDeleteId;
let cardToDeleteElement;

const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "ddea7e7d-786c-4a0d-af91-a819235b1f7a",
    "Content-Type": "application/json",
  },
});

api
  .getAppInfo()
  .then(([cards, userInfo]) => {
    const { name, about, avatar } = userInfo;
    profileName.textContent = name;
    profileDescription.textContent = about;
    const profileAvatar = document.querySelector(".profile__avatar");
    profileAvatar.src = avatar;

    cards.forEach((item) => {
      const cardElement = getCardElement(item, userInfo);
      cardsList.append(cardElement);
    });
  })
  .catch((err) => {
    console.error("Error fetching app info:", err);
  });

// Profile elements
const profileEditButton = document.querySelector(".profile__edit-button");
const cardEditButton = document.querySelector(".profile__add-button");
const avatarModalBtn = document.querySelector(".profile__avatar-btn");
const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");

// Form elements
const modals = document.querySelectorAll(".modal");
const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalCloseButton = editModal.querySelector(".modal__close-button");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);
const cardModal = document.querySelector("#add-card-modal");
const cardForm = cardModal.querySelector(".modal__form");
const cardSubmitBtn = cardModal.querySelector(".modal__submit-button");
const cardModalCloseButton = cardModal.querySelector(".modal__close-button");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

const previewModal = document.querySelector("#preview-modal");
const previewModalImageElement = previewModal.querySelector(".modal__image");
const previewModalCaptionElement =
  previewModal.querySelector(".modal__caption");
const previewModalCloseButton = previewModal.querySelector(
  ".modal__close-button"
);

// Avatar form elements
const avatarModal = document.querySelector("#avatar-modal");
const avatarForm = avatarModal.querySelector(".modal__form");
const avatarSubmitBtn = avatarModal.querySelector(".modal__submit-button");
const avatarModalCloseButton = avatarModal.querySelector(
  ".modal__close-button"
);
const avatarInput = avatarModal.querySelector("#profile-avatar-input");

// Delete form elements
const deleteModal = document.querySelector("#delete-modal");
const deleteModalCancelButton = deleteModal.querySelector(
  ".modal__cancel-button"
);
const deleteModalCloseButton = deleteModal.querySelector(
  ".modal__close-button_type_delete"
);

// Card related elements
const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");

function getCardElement(data, userInfo) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);

  const cardNameEl = cardElement.querySelector(".card__title");
  const cardImageEl = cardElement.querySelector(".card__image");
  const cardLikeButton = cardElement.querySelector(".card__like-button");
  const cardDeleteButton = cardElement.querySelector(".card__delete-button");

  cardNameEl.textContent = data.name;
  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;

  // Set initial like state based on whether the user has liked the card
  if (data.isLiked) {
    cardLikeButton.classList.add("card__like-button_liked");
  }

  // Like/Dislike logic
  cardLikeButton.addEventListener("click", () => {
    const isLiked = cardLikeButton.classList.contains(
      "card__like-button_liked"
    );

    if (isLiked) {
      api
        .dislikeCard(data._id)
        .then(() => {
          cardLikeButton.classList.remove("card__like-button_liked");
        })
        .catch((err) => {
          console.error("Error disliking card:", err);
        });
    } else {
      api
        .likeCard(data._id)
        .then(() => {
          cardLikeButton.classList.add("card__like-button_liked");
        })
        .catch((err) => {
          console.error("Error liking card:", err);
        });
    }
  });

  // Delete card logic
  cardDeleteButton.addEventListener("click", () => {
    cardToDeleteId = data._id;
    cardToDeleteElement = cardElement;
    openModal(deleteModal);
  });

  cardImageEl.addEventListener("click", () => {
    openModal(previewModal);
    previewModalImageElement.src = data.link;
    previewModalCaptionElement.textContent = data.name;
    previewModalImageElement.alt = data.name;
  });

  return cardElement; // Ensure this is inside the function
}

function closeOverlay(evt) {
  if (evt.target.classList.contains("modal")) {
    closeModal(evt.target);
  }
}

function handleEsc(evt) {
  if (evt.key === "Escape") {
    const openModal = document.querySelector(".modal_opened");
    if (openModal) {
      closeModal(openModal);
    }
  }
}

function openModal(modal) {
  modal.classList.add("modal_opened");
  modal.addEventListener("click", closeOverlay);
  document.addEventListener("keydown", handleEsc);
}

function closeModal(modal) {
  modal.classList.remove("modal_opened");
  modal.removeEventListener("click", closeOverlay);
  document.removeEventListener("keydown", handleEsc);
}

function handleEditFormSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true);

  api
    .editUserInfo({
      name: editModalNameInput.value,
      about: editModalDescriptionInput.value,
    })
    .then((data) => {
      profileName.textContent = data.name;
      profileDescription.textContent = data.about;
      closeModal(editModal);
    })
    .catch(console.error)
    .finally(() => {
      setButtonText(submitBtn, false);
    });
}

function handleAddCardSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true);
  const cardData = { name: cardNameInput.value, link: cardLinkInput.value };

  api
    .createCard(cardData)
    .then((data) => {
      const cardElement = getCardElement(data, { _id: "currentUserId" }); // Pass userInfo or mock it
      cardsList.prepend(cardElement);
      closeModal(cardModal);
      evt.target.reset();
      disableButton(submitBtn, settings);
    })
    .catch((err) => {
      console.error("Error creating card:", err);
    })
    .finally(() => {
      setButtonText(submitBtn, false);
    });
}

function handleDeleteCardSubmit(evt) {
  evt.preventDefault();
  const deleteConfirmButton = evt.submitter;
  setButtonText(deleteConfirmButton, "Deleting...");
  api
    .deleteCard(cardToDeleteId)
    .then(() => {
      cardToDeleteElement.remove(); // Remove the card from the DOM
      closeModal(deleteModal); // Close the modal
    })
    .catch((err) => {
      console.error("Error deleting card:", err);
    })
    .finally(() => {
      // Reset the button text to "Yes" (or the default text)
      setButtonText(deleteConfirmButton, "Delete");
    });
}

const deleteForm = deleteModal.querySelector(".modal__form");
deleteForm.addEventListener("submit", handleDeleteCardSubmit);

function handleAvatarSubmit(evt) {
  evt.preventDefault();
  const submitBtn = evt.submitter;
  setButtonText(submitBtn, true);
  const avatarUrl = avatarInput.value;

  api
    .updateAvatar(avatarUrl)
    .then((data) => {
      const profileAvatar = document.querySelector(".profile__avatar");
      profileAvatar.src = data.avatar;
      closeModal(avatarModal);
      evt.target.reset();
    })
    .catch((err) => {
      console.error("Error updating avatar:", err);
    })
    .finally(() => {
      setButtonText(submitBtn, false);
    });
}

profileEditButton.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(
    editFormElement,
    [editModalNameInput, editModalDescriptionInput],
    settings
  );

  openModal(editModal);
});
editModalCloseButton.addEventListener("click", () => closeModal(editModal));
editFormElement.addEventListener("submit", handleEditFormSubmit);

avatarModalBtn.addEventListener("click", () => {
  openModal(avatarModal);
});
avatarForm.addEventListener("submit", handleAvatarSubmit);

avatarModalCloseButton.addEventListener("click", () => closeModal(avatarModal));

cardEditButton.addEventListener("click", () => {
  openModal(cardModal);
});
cardModalCloseButton.addEventListener("click", () => closeModal(cardModal));
cardForm.addEventListener("submit", handleAddCardSubmit);
previewModalCloseButton.addEventListener("click", () =>
  closeModal(previewModal)
);
deleteModalCancelButton.addEventListener("click", () =>
  closeModal(deleteModal)
);
deleteModalCloseButton.addEventListener("click", () => closeModal(deleteModal));

enableValidation(settings);
