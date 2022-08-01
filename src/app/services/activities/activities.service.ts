import { GeoCode, SearchApi, Success2 } from '@amadeus/self-service-sdk-v1';
import { GetPointsOfInterestRequestData } from '@amadeus/self-service-sdk-v1/api/search/search-api';
import { PoiLocation } from '@amadeus/self-service-sdk-v1/models/base/poi-location';
import { Injectable } from '@angular/core';
import { catchError, from, map, Observable, of } from 'rxjs';
import { ApiManager } from '../api-manager';

/**
 * Class to handle the points of interest available in a city
 */
@Injectable({
  providedIn: 'root'
})
export class ActivitiesService {
  /**
   * Map that link the activity resolution per city code
   */
  public activityPerCityMap$: { [key: string]: Observable<PoiLocation[] | undefined> } = {};

  /**
   * Object to perform requests to the search endpoint
   * @private
   */
  private searchApi: SearchApi;

  constructor(apiManager: ApiManager) {
    this.searchApi = apiManager.getSearchApi();
  }

  /**
   * If there are no activities cached for a city code, will fetch them from the api
   * and cache them in the activityPerCityMap$
   *
   * @param cityCode city iata code (standard from the Internation Air Transport Association)
   * @param geoCode geolocation of the location
   */
  public loadActivities(cityCode: string, geoCode: GeoCode) {
    if (!this.activityPerCityMap$[cityCode]) {
      this.activityPerCityMap$[cityCode] = from(this.searchApi.getPointsOfInterest({
        ...geoCode,
        radius: 10,
        'page[limit]': 5,
        categories: ['SIGHTS', 'NIGHTLIFE']
      } as GetPointsOfInterestRequestData)).pipe(
        map((pointOfInterestResponse: Success2) => pointOfInterestResponse.data),
        catchError((err) => {
          // Request out of the geo localization square supported by the api will throw a 400 error
          if (err && err.statusCode === 400) {
            return of([]);
          }
          return of(undefined);
        })
      );
    }
  }
}
