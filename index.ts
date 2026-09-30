import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import room from "#app/pages/room";
import estimates from "#app/routes/estimates";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";

const app = new App();

app.route("/", home);
app.route("/r/:code/estimates.csv", estimates);
app.route("/r/:code", room);

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
