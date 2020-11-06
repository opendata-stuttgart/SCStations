import _ from 'lodash'
import 'whatwg-fetch'

let api = {

	getData: async function (URL) {

		return fetch(URL)
			.then((resp) => resp.json())
			.then((json) => {
				console.log('successful retrieved data');
					let cells = _.chain(json)
						.map((values) => {
							return {"type":"Feature","properties":{"id":values.sensor.id,"indoor":values.location.indoor,"type":values.sensor.sensor_type.name},"geometry":{"type":"Point","coordinates":[values.location.longitude,values.location.latitude]}}})
						.value();
//					return Promise.resolve({cells: cells});    
        return Promise.resolve({"type":"FeatureCollection","features":cells});            

			}).catch(function (error) {
				// If there is any error you will catch them here
				throw new Error(`Problems fetching data ${error}`)
			});
	}
};

export default api

//
//{"type":"FeatureCollection","features":[
//    
//    {"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[1.2544719999999998,41.120064]}},
//    
//]}