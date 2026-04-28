import { officeHoursService } from "./office-hours.service.js";
import { createOfficeHoursRouters } from "./office-hours.routes.factory.js";

// Production singletons: factory + продакшен-сервис.
// Тестам нужен createOfficeHoursRouters напрямую — этот файл не импортировать
// (он подтянет env/БД через chain to office-hours.service.js).

const { officeHoursRouter, officeHoursPsychologistRouter } =
  createOfficeHoursRouters(officeHoursService);

export { officeHoursRouter, officeHoursPsychologistRouter };
