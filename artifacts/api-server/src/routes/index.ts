import { Router, type IRouter } from "express";
import healthRouter from "./health";
import astraRouter from "./astra";

const router: IRouter = Router();

router.use(healthRouter);
router.use(astraRouter);

export default router;
