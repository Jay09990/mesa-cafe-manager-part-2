// Creates the standard API response envelope used by Mesa's JSON endpoints.
import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, statusCode = 200) {
  return NextResponse.json({ success: true, data, statusCode, errormsg: null }, { status: statusCode });
}

export function apiError(errormsg: string, statusCode: number) {
  return NextResponse.json({ success: false, data: null, statusCode, errormsg }, { status: statusCode });
}
