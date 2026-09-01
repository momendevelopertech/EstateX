import { Module } from "@nestjs/common";
import { PaymentPlansController } from "./payment-plans.controller";

@Module({ controllers: [PaymentPlansController] })
export class PaymentPlansModule {}
