class CollisionsController < ApplicationController
  def index
    # @collisions.count
    @collisions = Unirest.get("https://data.cityofnewyork.us/resource/qiz3-axqb.geojson?$where=number_of_pedestrians_injured > 0&date=2017-09-04T00:00:00.000&borough=MANHATTAN").body
    
  end
end
