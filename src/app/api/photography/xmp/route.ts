import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { analysis } = await req.json();
    
    if (!analysis || !analysis.lightroom_settings) {
      return NextResponse.json(
        { error: 'Analysis data is required' },
        { status: 400 }
      );
    }

    // XMP 템플릿 생성
    const xmpContent = generateXMP(analysis);
    
    // XMP 파일을 blob으로 반환
    return new Response(xmpContent, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="color-preset-${Date.now()}.xmp"`,
      },
    });
  } catch (error) {
    console.error('Error generating XMP:', error);
    return NextResponse.json(
      { error: 'Failed to generate XMP file' },
      { status: 500 }
    );
  }
}

function generateXMP(analysis: any): string {
  const { lightroom_settings } = analysis;
  const basic = lightroom_settings.basic || {};
  const hsl = lightroom_settings.hsl || {};
  const toneCurve = lightroom_settings.tone_curve || {};
  const colorGrading = lightroom_settings.color_grading || {};

  // HSL 값들을 XMP 형식으로 변환
  const hslAdjustments = [
    'Red', 'Orange', 'Yellow', 'Green', 'Aqua', 'Blue', 'Purple', 'Magenta'
  ].map(color => {
    const hslData = hsl[color.toLowerCase()] || { hue: 0, saturation: 0, luminance: 0 };
    return `${hslData.hue || 0}, ${hslData.saturation || 0}, ${hslData.luminance || 0}`;
  }).join(', ');

  const timestamp = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 7.0-c000 1.000000, 0000/00/00-00:00:00">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    xmp:CreatorTool="Mirror AI Photography Assistant"
    xmp:ModifyDate="${timestamp}"
    crs:RawFileName=""
    crs:Version="15.4"
    crs:ProcessVersion="11.00"
    crs:WhiteBalance="Custom"
    crs:Temperature="${basic.temperature || 5500}"
    crs:Tint="${basic.tint || 0}"
    crs:Exposure2012="${(basic.exposure || 0).toFixed(2)}"
    crs:Highlights2012="${basic.highlights || 0}"
    crs:Shadows2012="${basic.shadows || 0}"
    crs:Whites2012="${basic.whites || 0}"
    crs:Blacks2012="${basic.blacks || 0}"
    crs:Texture="${basic.texture || 0}"
    crs:Clarity2012="${basic.clarity || 0}"
    crs:Vibrance="${basic.vibrance || 0}"
    crs:Saturation="${basic.saturation || 0}"
    crs:ParametricShadows="${toneCurve.shadows || 0}"
    crs:ParametricDarks="${toneCurve.darks || 0}"
    crs:ParametricLights="${toneCurve.lights || 0}"
    crs:ParametricHighlights="${toneCurve.highlights || 0}"
    crs:ParametricShadowSplit="25"
    crs:ParametricMidtoneSplit="50"
    crs:ParametricHighlightSplit="75"
    crs:HueAdjustmentRed="${hsl.red?.hue || 0}"
    crs:HueAdjustmentOrange="${hsl.orange?.hue || 0}"
    crs:HueAdjustmentYellow="${hsl.yellow?.hue || 0}"
    crs:HueAdjustmentGreen="${hsl.green?.hue || 0}"
    crs:HueAdjustmentAqua="${hsl.aqua?.hue || 0}"
    crs:HueAdjustmentBlue="${hsl.blue?.hue || 0}"
    crs:HueAdjustmentPurple="${hsl.purple?.hue || 0}"
    crs:HueAdjustmentMagenta="${hsl.magenta?.hue || 0}"
    crs:SaturationAdjustmentRed="${hsl.red?.saturation || 0}"
    crs:SaturationAdjustmentOrange="${hsl.orange?.saturation || 0}"
    crs:SaturationAdjustmentYellow="${hsl.yellow?.saturation || 0}"
    crs:SaturationAdjustmentGreen="${hsl.green?.saturation || 0}"
    crs:SaturationAdjustmentAqua="${hsl.aqua?.saturation || 0}"
    crs:SaturationAdjustmentBlue="${hsl.blue?.saturation || 0}"
    crs:SaturationAdjustmentPurple="${hsl.purple?.saturation || 0}"
    crs:SaturationAdjustmentMagenta="${hsl.magenta?.saturation || 0}"
    crs:LuminanceAdjustmentRed="${hsl.red?.luminance || 0}"
    crs:LuminanceAdjustmentOrange="${hsl.orange?.luminance || 0}"
    crs:LuminanceAdjustmentYellow="${hsl.yellow?.luminance || 0}"
    crs:LuminanceAdjustmentGreen="${hsl.green?.luminance || 0}"
    crs:LuminanceAdjustmentAqua="${hsl.aqua?.luminance || 0}"
    crs:LuminanceAdjustmentBlue="${hsl.blue?.luminance || 0}"
    crs:LuminanceAdjustmentPurple="${hsl.purple?.luminance || 0}"
    crs:LuminanceAdjustmentMagenta="${hsl.magenta?.luminance || 0}"
    crs:ShadowTint="${colorGrading.shadows?.hue || 0}"
    crs:ColorGradeShadowLum="0"
    crs:ColorGradeMidtoneHue="${colorGrading.midtones?.hue || 0}"
    crs:ColorGradeMidtoneSat="${colorGrading.midtones?.saturation || 0}"
    crs:ColorGradeMidtoneLum="0"
    crs:ColorGradeHighlightHue="${colorGrading.highlights?.hue || 0}"
    crs:ColorGradeHighlightSat="${colorGrading.highlights?.saturation || 0}"
    crs:ColorGradeHighlightLum="0"
    crs:ColorGradeBlending="50"
    crs:ColorGradeGlobalHue="0"
    crs:ColorGradeGlobalSat="0"
    crs:ColorGradeGlobalLum="0"
    crs:AutoLateralCA="0"
    crs:LensProfileEnable="0"
    crs:LensManualDistortionAmount="0"
    crs:VignetteAmount="0"
    crs:DefringePurpleAmount="0"
    crs:DefringePurpleHueLo="30"
    crs:DefringePurpleHueHi="70"
    crs:DefringeGreenAmount="0"
    crs:DefringeGreenHueLo="40"
    crs:DefringeGreenHueHi="60"
    crs:PerspectiveUpright="0"
    crs:PerspectiveVertical="0"
    crs:PerspectiveHorizontal="0"
    crs:PerspectiveRotate="0.0"
    crs:PerspectiveAspect="0"
    crs:PerspectiveScale="100"
    crs:PerspectiveX="0.00"
    crs:PerspectiveY="0.00"
    crs:GrainAmount="0"
    crs:PostCropVignetteAmount="0"
    crs:ShadowTint="0"
    crs:RedHue="0"
    crs:RedSaturation="0"
    crs:GreenHue="0"
    crs:GreenSaturation="0"
    crs:BlueHue="0"
    crs:BlueSaturation="0"
    crs:HDREditMode="0"
    crs:ConvertToGrayscale="False"
    crs:OverrideLookVignette="False"
    crs:ToneCurveName2012="Linear"
    crs:CameraProfile="Adobe Standard"
    crs:CameraProfileDigest="87FB0EDC503E2E4E86D199DCDC849CD5"
    crs:HasSettings="True"
    crs:CropTop="0"
    crs:CropLeft="0"
    crs:CropBottom="1"
    crs:CropRight="1"
    crs:CropAngle="0"
    crs:CropConstrainToWarp="0"
    crs:HasCrop="False"
    crs:AlreadyApplied="True">
    <crs:ToneCurvePV2012>
     <rdf:Seq>
      <rdf:li>0, 0</rdf:li>
      <rdf:li>255, 255</rdf:li>
     </rdf:Seq>
    </crs:ToneCurvePV2012>
    <crs:ToneCurvePV2012Red>
     <rdf:Seq>
      <rdf:li>0, 0</rdf:li>
      <rdf:li>255, 255</rdf:li>
     </rdf:Seq>
    </crs:ToneCurvePV2012Red>
    <crs:ToneCurvePV2012Green>
     <rdf:Seq>
      <rdf:li>0, 0</rdf:li>
      <rdf:li>255, 255</rdf:li>
     </rdf:Seq>
    </crs:ToneCurvePV2012Green>
    <crs:ToneCurvePV2012Blue>
     <rdf:Seq>
      <rdf:li>0, 0</rdf:li>
      <rdf:li>255, 255</rdf:li>
     </rdf:Seq>
    </crs:ToneCurvePV2012Blue>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
} 