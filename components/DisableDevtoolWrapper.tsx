"use client";
import React, { useEffect } from "react";
import DisableDevtool from "disable-devtool";

export default function DisableDevtoolWrapper() {
  useEffect(() => {
    DisableDevtool({
      // Bypass: http://localhost:3000/?anix-dd
      tkName: "anix-dd",
      disableMenu: true,
      clearLog: true,
      disableSelect: true,
      disableCopy: true,
      disableCut: true,
      disablePaste: true,
    });
  }, []);

  return null;
}
