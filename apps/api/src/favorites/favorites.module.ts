import { Module } from "@nestjs/common";
import { FavoritesController } from "./favorites.controller";
import { ComparisonsController } from "./comparisons.controller";

@Module({ controllers: [FavoritesController, ComparisonsController] })
export class FavoritesModule {}
