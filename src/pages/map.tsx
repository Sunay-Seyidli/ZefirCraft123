import { GetServerSideProps } from "next";
import { useEffect } from "react";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "http://zefircraft.ddns.net:8123/?worldname=Towny",
      permanent: false,
    },
  };
};

export default function MapRedirectPage() {
  useEffect(() => {
    window.location.replace("http://zefircraft.ddns.net:8123/?worldname=Towny");
  }, []);

  return null;
}
