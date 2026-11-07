
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function LocationMap({ locations = [] }) {
  const validLocations = locations.filter(
    location =>
      location.latitude !== null &&
      location.longitude !== null &&
      Number.isFinite(Number(location.latitude)) &&
      Number.isFinite(Number(location.longitude))
  );

  return (
    <div className="location-map">
      <MapContainer
        center={[19.076, 72.8777]}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validLocations.map(location => (
          <Marker
            key={location.id}
            position={[
              Number(location.latitude),
              Number(location.longitude)
            ]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{location.location_name}</strong>
              <br />
              {location.address}
              <br />
              Area: {location.area}
              <br />
              Status: {location.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {validLocations.length === 0 && (
        <p className="muted">
          No locations with valid coordinates are available to display.
        </p>
      )}
    </div>
  );
}

export default LocationMap;
