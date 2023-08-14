(() => {
  // public/js/leaflet.js
  var displayMap = (locations) => {
    const map = L.map("map", { zoomControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    var greenIcon = L.icon({
      iconUrl: "/img/pin.png",
      iconSize: [32, 40],
      // size of the icon
      iconAnchor: [16, 40],
      // point of the icon which will correspond to marker's location
      popupAnchor: [0, -50]
      // point from which the popup should open relative to the iconAnchor
    });
    const points = [];
    locations.forEach((loc) => {
      points.push([loc.coordinates[1], loc.coordinates[0]]);
      L.marker([loc.coordinates[1], loc.coordinates[0]], { icon: greenIcon }).addTo(map).bindPopup(`<p>Day ${loc.day}: ${loc.description}</p>`, {
        autoClose: false,
        className: "mapPopup"
      }).openPopup();
    });
    const bounds = L.latLngBounds(points).pad(0.5);
    map.fitBounds(bounds);
    map.scrollWheelZoom.disable();
    map.remove();
  };

  // public/js/alerts.js
  var hideAlert = () => {
    const el = document.querySelector(".alert");
    if (el)
      el.parentElement.removeChild(el);
  };
  var showAlert = (type, msg) => {
    hideAlert();
    const markup = `<div class="alert alert--${type}">${msg}</div>`;
    document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
    window.setTimeout(hideAlert, 5e3);
  };

  // public/js/login.js
  var login = async (email, password) => {
    try {
      const res = await axios({
        method: "POST",
        url: "/api/v1/users/login",
        data: {
          email,
          password
        }
      });
      if (res.data.status === "success") {
        showAlert("success", "Logged in successfully!");
        window.setTimeout(() => {
          location.assign("/");
        }, 1500);
      }
    } catch (err) {
      showAlert("error", err.response.data.message);
    }
  };
  var logout = async () => {
    try {
      const res = await axios({
        method: "GET",
        url: "/api/v1/users/logout"
      });
      if (res.data.status === "success")
        location.reload(true);
    } catch (error) {
      showAlert("error", "Error logging out! Try again.");
    }
  };

  // public/js/updateSettings.js
  var updateSettings = async (data, type) => {
    try {
      const url = type === "password" ? "/api/v1/users/updateMyPassword" : "/api/v1/users/updateMe";
      const res = await axios({
        method: "PATCH",
        url,
        data
      });
      if (res.data.status === "success") {
        showAlert("success", `${type.toUpperCase()} updated successfully!`);
      }
    } catch (err) {
      showAlert("error", err.response.data.message);
    }
  };

  // public/js/stripe.js
  var bookTour = async (tourId) => {
    const stripe = Stripe(process.env.STRIPE_TEST_KEY);
    try {
      const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
      await stripe.redirectToCheckout({
        sessionId: session.data.session.id
      });
    } catch (error) {
      console.log(error);
      showAlert("error", error);
    }
  };

  // public/js/index.js
  var leaflet = document.getElementById("map");
  var loginForm = document.querySelector(".form--login");
  var logOutBtn = document.querySelector(".nav__el--logout");
  var updateDataForm = document.querySelector(".form-user-data");
  var updatePasswordForm = document.querySelector(".form-user-password");
  var bookBtn = document.getElementById("book-tour");
  if (leaflet) {
    const locations = JSON.parse(leaflet.dataset.locations);
    displayMap(locations);
  }
  if (loginForm)
    document.querySelector(".form").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      login(email, password);
    });
  if (logOutBtn)
    logOutBtn.addEventListener("click", logout);
  if (updateDataForm)
    updateDataForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append("name", document.getElementById("name").value);
      form.append("email", document.getElementById("email").value);
      form.append("photo", document.getElementById("photo").files[0]);
      updateSettings(form, "data");
    });
  if (updatePasswordForm)
    updatePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      document.querySelector(".btn--save-password").textContent = "Updating...";
      const passwordCurrent = document.getElementById("password-current").value;
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;
      await updateSettings(
        { passwordCurrent, password, passwordConfirm },
        "password"
      );
      document.querySelector(".btn--save-password").textContent = "SAVE PASSWORD";
      document.getElementById("password-current").value = "";
      document.getElementById("password").value = "";
      document.getElementById("password-confirm").value = "";
    });
  if (bookBtn)
    bookBtn.addEventListener("click", (e) => {
      e.target.textContent = "Processing...";
      const { tourId } = e.target.dataset;
      bookTour(tourId);
    });
})();
