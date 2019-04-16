import React, { Component } from 'react';
import { Animated, StyleSheet, Dimensions, Image, View, InteractionManager } from 'react-native';
import { CachedImage, ImageCacheProvider } from 'react-native-cached-image';
import { PermissionsAndroid } from 'react-native';
import DynmaicImage from './DynamicImage';
import Svg,{
    Circle,
    Ellipse,
    G,
    Text,
    TSpan,
    TextPath,
    Path,
    Polygon,
    Polyline,
    Line,
    Rect,
    Use,
    Symbol,
    Defs,
    LinearGradient,
    RadialGradient,
    Stop,
    ClipPath,
    Pattern,
    Mask,
} from 'react-native-svg';

import {
  PanGestureHandler,
  PinchGestureHandler,
  ScrollView,
  State,
} from 'react-native-gesture-handler';
import DynamicImage from './DynamicImage';
import LargeImage from './LargeImage';

var USENATIVEDRIVER = false;

const styles = StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    box: {
      width: 3000,
      height: 3000,
      alignSelf: 'center',
      backgroundColor: 'plum',
      margin: 10,
      zIndex: 200,
    },
  });

var NODES = {
    "A": { lat: 33.810561, long: -117.918975, links: [ "Z00", "Z01", "I" ] },
    "Z00": { lat: 33.810341, long: -117.919213, links: [ "A", "B" ] },
    "B": { lat: 33.810189, long: -117.919188, links: [ "Z00", "C" ] },
    "C": { lat: 33.810201, long: -117.918768, links: [ "B", "Z01" ] },
    "Z01": { lat: 33.810403, long: -117.918743, links: [ "C", "A" ] },
    "I": { lat: 33.811668, long: -117.918978, links: [ "M", "F", "J", "A" ] },
    "M": { lat: 33.811861, long: -117.918983, links: [ "I", "N", "B00" ] },
    "N": { lat: 33.811910, long: -117.918819, links: [ "M", "P", "K" ] },
    "P": { lat: 33.812005, long: -117.918718, links: [ "N", "Q", "O" ] },
    "Q": { lat: 33.812108, long: -117.918705, links: [ "P", "R", "B01" ] },
    "R": { lat: 33.812284, long: -117.918802, links: [ "Q", "S" ] },
    "S": { lat: 33.812327, long: -117.918980, links: [ "R", "T", "B02", "A00" ] },
    "T": { lat: 33.812280, long: -117.919148, links: [ "S", "U" ] },
    "U": { lat: 33.812093, long: -117.919260, links: [ "T", "V", "B03", "A04" ] },
    "V": { lat: 33.811992, long: -117.919228, links: [ "U", "W", "H", "A06" ] },
    "W": { lat: 33.811900, long: -117.919128, links: [ "V", "G", "M" ] },
    // ----
    "F": { lat: 33.811680, long: -117.919149, links: [ "G", "I" ] },
    "G": { lat: 33.811772, long: -117.919251, links: [ "F", "H", "W" ] },
    "H": { lat: 33.811921, long: -117.919417, links: [ "G", "V" ] },
    // ----
    "J": { lat: 33.811635, long: -117.918762, links: [ "K", "I" ] },
    "K": { lat: 33.811802, long: -117.918693, links: [ "J", "O", "N" ] },
    "O": { lat: 33.811920, long: -117.918574, links: [ "K", "L" ] },
    "L": { lat: 33.811977, long: -117.918326, links: [ "O", "A09" ] },
    "A09": { lat: 33.812020, long: -117.918157, links: [ "L" ] },
    // ----
    "X": { lat: 33.812111, long: -117.918442, links: [ "Z", "L", "Q" ] },
    "Z": { lat: 33.812189, long: -117.918394, links: [ "X", "B04", "Y" ] },
    "B04": { lat: 33.812207, long: -117.918274, links: [ "Z", "A08" ] },
    "A08": { lat: 33.812166, long: -117.918135, links: [ "B04", "A10" ] },
    "A10": { lat: 33.812103, long: -117.918007, links: [ "A08", "A11", "A09" ] },
    "A11": { lat: 33.812107, long: -117.917590, links: [ "A10", "A12", "A20" ] },
    "A12": { lat: 33.812158, long: -117.917453, links: [ "A11", "A13" ] },
    "A13": { lat: 33.812174, long: -117.917375, links: [ "A12", "A14" ] },
    "A14": { lat: 33.812212, long: -117.917350, links: [ "A13", "A15" ] },
    "A15": { lat: 33.812603, long: -117.917330, links: [ "A14", "A16", "A31" ] },
    "A16": { lat: 33.812581, long: -117.916976, links: [ "A15", "A17" ] },
    "A17": { lat: 33.812477, long: -117.916882, links: [ "A16", "A18" ] },
    "A18": { lat: 33.812357, long: -117.916854, links: [ "A17", "A19" ] },
    "A19": { lat: 33.812352, long: -117.916549, links: [ "A18" ] },
    // ----
    "A20": { lat: 33.812009, long: -117.917416, links: [ "A21", "A11" ] },
    "A21": { lat: 33.811892, long: -117.917204, links: [ "A20", "A22", "A25" ] },
    "A22": { lat: 33.811779, long: -117.917189, links: [ "A21", "A23" ] },
    "A23": { lat: 33.811704, long: -117.917068, links: [ "A22", "A24" ] },
    "A24": { lat: 33.811843, long: -117.916945, links: [ "A23", "A25" ] },
    "A25": { lat: 33.811913, long: -117.917037, links: [ "A24", "A26", "A21" ] },
    "A26": { lat: 33.812149, long: -117.916975, links: [ "A25", "A18" ] },
    // ----
    "Y": { lat: 33.812448, long: -117.918689, links: [ "A27", "R", "Z", "A79" ] },
    "A27": { lat: 33.812504, long: -117.918642, links: [ "Y", "A28" ] },
    "A28": { lat: 33.812665, long: -117.918323, links: [ "A27", "A29" ] },
    "A29": { lat: 33.812685, long: -117.918223, links: [ "A28", "A30" ] },
    "A30": { lat: 33.812689, long: -117.917541, links: [ "A29", "A31", "A32" ] },
    "A31": { lat: 33.812689, long: -117.917395, links: [ "A30", "A15", "A32" ] },
    // ----
    "A32": { lat: 33.812814, long: -117.917522, links: [ "A33" ] },   //there should be another link
    "A33": { lat: 33.812992, long: -117.917563, links: [ "A32", "A34" ] },
    "A34": { lat: 33.813316, long: -117.917411, links: [ "A33", "A35" ] },
    "A35": { lat: 33.813535, long: -117.917517, links: [ "A34", "A36" ] },
    "A36": { lat: 33.813613, long: -117.917849, links: [ "A35", "A37" ] },
    "A37": { lat: 33.813548, long: -117.918112, links: [ "A36", "A41", "A47", "A40" ] },
    "A41": { lat: 33.813808, long: -117.917981, links: [ "A37", "A42" ] },
    "A42": { lat: 33.814224, long: -117.917998, links: [ "A41", "A43" ] },
    "A43": { lat: 33.814328, long: -117.918205, links: [ "A42", "A44" ] },
    "A44": { lat: 33.814936, long: -117.918343, links: [ "A43", "A45" ] },
    "A45": { lat: 33.815218, long: -117.918479, links: [ "A44" ] },
    // ----
    "A38": { lat: 33.813050, long: -117.918313, links: [ "A39", "A28" ] },
    "A39": { lat: 33.813208, long: -117.918225, links: [ "A38", "A40" ] },
    "A40": { lat: 33.813331, long: -117.918215, links: [ "A39", "A46", "A37" ] },
    "A46": { lat: 33.813401, long: -117.918430, links: [ "A40", "A47" ] },
    "A47": { lat: 33.813581, long: -117.918506, links: [ "A46", "A48", "A37"] },
    "A48": { lat: 33.813493, long: -117.918828, links: [ "A47", "A49", "A53" ] },
    "A49": { lat: 33.813383, long: -117.918804, links: [ "A48", "A50" ] },
    "A50": { lat: 33.813291, long: -117.918879, links: [ "A49", "A51", "A70" ] },
    "A51": { lat: 33.813293, long: -117.919096, links: [ "A50", "A52", "A70" ] },
    "A52": { lat: 33.813434, long: -117.919146, links: [ "A51", "A53" ] },
    "A53": { lat: 33.813538, long: -117.919098, links: [ "A52", "A54", "A48" ] },
    "A54": { lat: 33.813649, long: -117.919317, links: [ "A53", "A55" ] },
    "A55": { lat: 33.813634, long: -117.919588, links: [ "A54", "A56" ] },
    "A56": { lat: 33.813570, long: -117.919643, links: [ "A55", "A57" ] },
    "A57": { lat: 33.813541, long: -117.919779, links: [ "A56", "A58" ] },
    "A58": { lat: 33.813707, long: -117.920101, links: [ "A57", "A59" ] },
    "A59": { lat: 33.813756, long: -117.920277, links: [ "A58", "A60" ] },
    "A60": { lat: 33.813744, long: -117.920365, links: [ "A59", "A61" ] },
    "A61": { lat: 33.813689, long: -117.920483, links: [ "A60", "A62" ] },
    "A62": { lat: 33.813575, long: -117.920545, links: [ "A61", "A63" ] },
    "A63": { lat: 33.813568, long: -117.920585, links: [ "A62", "A64" ] },
    "A64": { lat: 33.813439, long: -117.920693, links: [ "A63", "A65" ] },
    "A65": { lat: 33.813127, long: -117.920843, links: [ "A64", "A66" ] },
    "A66": { lat: 33.812978, long: -117.920746, links: [ "A65", "A67" ] },
    "A67": { lat: 33.812811, long: -117.920780, links: [ "A66", "A68" ] },
    "A68": { lat: 33.812450, long: -117.920479, links: [ "A67", "A69" ] },
    "A69": { lat: 33.812229, long: -117.920435, links: [ "A68", "A81" ] },
    "A81": { lat: 33.811995, long: -117.920436, links: [ "A69", "A82" ] },
    "A82": { lat: 33.811749, long: -117.920603, links: [ "A81", "A83" ] },
    "A83": { lat: 33.811536, long: -117.920836, links: [ "A82", "A84" ] },
    "A84": { lat: 33.811382, long: -117.921084, links: [ "A83", "A85" ] },
    "A85": { lat: 33.811400, long: -117.921293, links: [ "A84", "A86" ] },
    "A86": { lat: 33.811434, long: -117.921468, links: [ "A85", "A87" ] },
    "A87": { lat: 33.811511, long: -117.921640, links: [ "A86", "A88" ] },
    "A88": { lat: 33.811649, long: -117.921786, links: [ "A87", "A89" ] },
    "A89": { lat: 33.811811, long: -117.921884, links: [ "A88", "A90" ] },
    "A90": { lat: 33.811935, long: -117.922087, links: [ "A89", "A91" ] },
    "A91": { lat: 33.812041, long: -117.922102, links: [ "A90", "A92" ] },
    "A92": { lat: 33.812321, long: -117.922046, links: [ "A91", "A93" ] },
    "A93": { lat: 33.812389, long: -117.922061, links: [ "A92", "A94" ] },
    "A94": { lat: 33.812432, long: -117.922139, links: [ "A93", "A95" ] },
    "A95": { lat: 33.812401, long: -117.922296, links: [ "A94", "A96" ] },
    "A96": { lat: 33.812342, long: -117.922468, links: [ "A95", "A97" ] },
    "A97": { lat: 33.812366, long: -117.922669, links: [ "A96", "A98" ] },
    "A98": { lat: 33.812344, long: -117.922794, links: [ "A97", "A99" ] },
    "A99": { lat: 33.812270, long: -117.922961, links: [ "A98", "B05" ] },
    "B05": { lat: 33.812028, long: -117.923125, links: [ "A99" ] },
    // ----
    "A70": { lat: 33.813175, long: -117.918979, links: [ "A71", "A50", "A51" ] },
    "A71": { lat: 33.812913, long: -117.918986, links: [ "A70", "A00", "A76", "A72" ] },
    // ----
    "A72": { lat: 33.812880, long: -117.919159, links: [ "A73" ] },  //missing link
    "A73": { lat: 33.812809, long: -117.919246, links: [ "A72", "A74" ] },
    "A74": { lat: 33.812730, long: -117.919261, links: [ "A73", "A75" ] },
    "A75": { lat: 33.812618, long: -117.919201, links: [ "A74", "A01" ] },
    // ----
    "A76": { lat: 33.812855, long: -117.918745, links: [ "A77" ] },    //missing link
    "A77": { lat: 33.812659, long: -117.918716, links: [ "A76", "A78" ] },
    "A78": { lat: 33.812580, long: -117.918787, links: [ "A77", "A79" ] },
    "A79": { lat: 33.812532, long: -117.918773, links: [ "A78", "Y", "A00" ] },
    // ----
    "B00": { lat: 33.812046, long: -117.918979, links: [ "B01", "M", "B03" ] },
    "B01": { lat: 33.812091, long: -117.918916, links: [ "B00", "B02", "Q" ] },
    "B02": { lat: 33.812150, long: -117.918980, links: [ "B01", "B03", "S" ] },
    "B03": { lat: 33.812095, long: -117.919048, links: [ "B02", "U", "B00" ] },
    // ----
    "A00": { lat: 33.812455, long: -117.918982, links: [ "A01", "S", "A71", "A79" ] },
    "A01": { lat: 33.812542, long: -117.919216, links: [ "A00", "A02" ] },
    "A02": { lat: 33.812566, long: -117.919357, links: [ "A01", "A03" ] },
    // ----
    "A03": { lat: 33.812437, long: -117.919323, links: [ "Z02", "T", "A02" ] },
    "Z02": { lat: 33.812355, long: -117.919376, links: [ "A03", "Z03" ] },
    "Z03": { lat: 33.812320, long: -117.919489, links: [ "Z02", "Z04" ] },
    "Z04": { lat: 33.812243, long: -117.919584, links: [ "Z03", "A04" ] },
    "A04": { lat: 33.812114, long: -117.919637, links: [ "Z04", "A05" ] },
    "A05": { lat: 33.812119, long: -117.919768, links: [ "A04", "Z05" ] },
    // ----
    "A06": { lat: 33.811860, long: -117.919715, links: [ "A07" ] },  //missing link
    "A07": { lat: 33.811900, long: -117.919796, links: [ "Z05", "A06" ] },
    "Z05": { lat: 33.811976, long: -117.919735, links: [ "A07", "A05" ] },
    // ----
    "B06": { lat: 33.811632, long: -117.919831, links: [ "A06", "B07" ] },
    "B07": { lat: 33.81156, long: -117.919907, links: [ "B06", "B08" ] },
    "B08": { lat: 33.811543, long: -117.920006, links: [ "B07", "B09" ] },
    "B09": { lat: 33.811497, long: -117.920159, links: [ "B08", "B10" ] },
    "B10": { lat: 33.811439, long: -117.920339, links: [ "B09", "B11" ] },
    "B11": { lat: 33.811446, long: -117.920438, links: [ "B10", "B12" ] },
    "B12": { lat: 33.811412, long: -117.920550, links: [ "B11", "B13" ] },
    "B13": { lat: 33.811348, long: -117.920601, links: [ "B12", "B14" ] },
    "B14": { lat: 33.811349, long: -117.920659, links: [ "B13", "B15" ] },
    "B15": { lat: 33.811407, long: -117.920730, links: [ "B14", "B16" ] },
    "B16": { lat: 33.811419, long: -117.920797, links: [ "B15", "B17" ] },
    "B17": { lat: 33.811422, long: -117.920832, links: [ "B16", "B18" ] },
    "B18": { lat: 33.811409, long: -117.920924, links: [ "B17", "B19" ] },
    "B19": { lat: 33.811312, long: -117.921014, links: [ "B18", "B20" ] },
    "B20": { lat: 33.811165, long: -117.921113, links: [ "B19", "B21" ] },
    "B21": { lat: 33.811094, long: -117.921183, links: [ "B20", "B22" ] },
    "B22": { lat: 33.811043, long: -117.921288, links: [ "B21", "B23" ] },
    "B23": { lat: 33.811047, long: -117.921582, links: [ "B22", "B24" ] },
    "B24": { lat: 33.811083, long: -117.921651, links: [ "B23", "B25" ] },
    "B25": { lat: 33.811132, long: -117.921768, links: [ "B24", "B26" ] },
    "B26": { lat: 33.811320, long: -117.921802, links: [ "B25", "B27" ] },
    "B27": { lat: 33.811350, long: -117.921920, links: [ "B26", "B28" ] },
    "B28": { lat: 33.811455, long: -117.921956, links: [ "B27", "A88" ] },
    // ----
    "B29": { lat: 33.808814, long: -117.918980, links: [ "B30" ] },
    "B30": { lat: 33.808050, long: -117.918977, links: [ "B29", "B31" ] },
    "B31": { lat: 33.807873, long: -117.919011, links: [ "B30", "B32" ] },
    "B32": { lat: 33.807796, long: -117.919091, links: [ "B31", "B33" ] },
    "B33": { lat: 33.807734, long: -117.919340, links: [ "B32", "B34" ] },
    "B34": { lat: 33.807686, long: -117.919387, links: [ "B33", "B35" ] },
    "B35": { lat: 33.807561, long: -117.919366, links: [ "B34", "B36" ] },
    "B36": { lat: 33.807491, long: -117.919244, links: [ "B35", "B37" ] },
    "B37": { lat: 33.807535, long: -117.919103, links: [ "B36", "B38" ] },
    "B38": { lat: 33.807627, long: -117.919018, links: [ "B37", "B39" ] },
    "B39": { lat: 33.807710, long: -117.919073, links: [ "B38", "B32" ] },
    // ----
    "B40": { lat: 33.807647, long: -117.918912, links: [ "B38", "B41" ] },
    "B41": { lat: 33.807652, long: -117.917831, links: [ "B40", "B42", "B52" ] },
    "B42": { lat: 33.807654, long: -117.917224, links: [ "B41", "B43" ] },
    "B43": { lat: 33.807604, long: -117.917144, links: [ "B42", "B44", "B57" ] },
    "B44": { lat: 33.807518, long: -117.917117, links: [ "B43", "B45" ] },
    "B45": { lat: 33.807100, long: -117.917114, links: [ "B44", "B46" ] },
    "B46": { lat: 33.807063, long: -117.917128, links: [ "B45", "B47" ] },
    "B47": { lat: 33.807017, long: -117.917167, links: [ "B46", "B48" ] },
    "B48": { lat: 33.806868, long: -117.917364, links: [ "B47", "B49" ] },
    "B49": { lat: 33.806847, long: -117.917375, links: [ "B48", "B50" ] },
    "B50": { lat: 33.806807, long: -117.917389, links: [ "B49", "B51" ] },
    "B51": { lat: 33.806664, long: -117.917389, links: [ "B50" ] },
    // ----
    "B52": { lat: 33.807813, long: -117.917743, links: [ "B41", "B53" ] },
    "B53": { lat: 33.808091, long: -117.917406, links: [ "B52", "B54" ] },
    "B54": { lat: 33.808100, long: -117.917194, links: [ "B53", "B55" ] },
    "B55": { lat: 33.808074, long: -117.917129, links: [ "B54", "B56" ] },
    "B56": { lat: 33.808018, long: -117.917110, links: [ "B55", "B57" ] },
    "B57": { lat: 33.807715, long: -117.917121, links: [ "B56", "B58" ] },
    // ----
    "B58": { lat: 33.807961, long: -117.920034, links: [ "B34", "B59" ] },
    "B59": { lat: 33.808149, long: -117.920473, links: [ "B58", "B60" ] },
    "B60": { lat: 33.808133, long: -117.920651, links: [ "B59", "B61" ] },
    "B61": { lat: 33.808031, long: -117.920844, links: [ "B60", "B62" ] },
    "B62": { lat: 33.807892, long: -117.920996, links: [ "B61", "B63" ] },
    "B63": { lat: 33.807653, long: -117.921020, links: [ "B62", "B64" ] },
    "B64": { lat: 33.807466, long: -117.921039, links: [ "B63", "B65" ] },
    "B65": { lat: 33.807362, long: -117.921081, links: [ "B64", "B66" ] },
    "B66": { lat: 33.807237, long: -117.921241, links: [ "B65", "B67" ] },
    "B67": { lat: 33.807123, long: -117.921345, links: [ "B66", "B68" ] },
    "B68": { lat: 33.806971, long: -117.921359, links: [ "B67", "B69" ] },
    "B69": { lat: 33.806832, long: -117.921279, links: [ "B68", "B70" ] },
    "B70": { lat: 33.806741, long: -117.921121, links: [ "B69", "B71" ] },
    "B71": { lat: 33.806645, long: -117.920957, links: [ "B70", "B72" ] },
    "B72": { lat: 33.806550, long: -117.920922, links: [ "B71", "B73" ] },
    "B73": { lat: 33.806196, long: -117.920930, links: [ "B72", "B74" ] },
    "B74": { lat: 33.806126, long: -117.920968, links: [ "B73", "B75" ] },
    "B75": { lat: 33.806029, long: -117.920953, links: [ "B74", "B76" ] },
    "B76": { lat: 33.805978, long: -117.920933, links: [ "B75", "B77" ] },
    "B77": { lat: 33.805939, long: -117.920851, links: [ "B76", "B78" ] },
    "B78": { lat: 33.805984, long: -117.920758, links: [ "B77", "B79" ] },
    "B79": { lat: 33.806023, long: -117.920748, links: [ "B78", "B80" ] },
    "B80": { lat: 33.806179, long: -117.920747, links: [ "B79", "B81" ] },
    "B81": { lat: 33.806185, long: -117.920268, links: [ "B80" ] }
}

export default class ResortMap extends Component {
    static navigationOptions = {
        title: 'ResortMap',
        header: null
    };

    constructor(props) {
        super(props);
        this.HIGHEST_SCALE = 4;
        this.HIGHEST_SCALE_COUNT = 11;
        this.markerRadius = 50;

        this.initScalePan();
        this.state = {
            latitude: null,
            longitude: null,
            lines: []
        }
    }

    initScalePan() {
        this.x = 1500;
        this.y = 1500;
        this.totalW = 10000;
        this.totalH = 10000;
        this.deviceW = Dimensions.get('window').width;
        this.deviceH = Dimensions.get('window').height;
        this.scaleValue = 1;
        this.lastScale = 1;
        this.animOffset = { x: 0, y: 0 };
        this.lastOffset = { x: 0, y: 0 };
        this.totalOffset = { x: 0, y: 0 };
        this.focalPoint = { x: 0, y: 0 };
        this.pinchPoint = null;
        this.translateX = new Animated.Value(0);
        this.translateY = new Animated.Value(0);
        this.baseScale = new Animated.Value(1);
        this.pinchScale = new Animated.Value(1);
        this.scale = Animated.multiply(this.baseScale, this.pinchScale);
        this.focalX = new Animated.Value(0);
        this.focalY = new Animated.Value(0);
        this.translateX.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this.animOffset.x = value - this.lastOffset.x;
            if (Math.abs(this.totalOffset.x - value) < 0.001) {
                if (this.translatedY && !this.decaying) {
                    this.checkUpdate();
                }
                this.translatedX = true;
            } else {
                this.translatedX = false;
            }
            this.totalOffset.x = value;
            //this.checkUpdate();
        });
        this.translateY.addListener(( {value} ) => {
            //We multiply lastOffset by two because the value is not 0 and the offset has been set
            this.animOffset.y = value - this.lastOffset.y;
            if (Math.abs(this.totalOffset.y - value) < 0.001) {
                if (this.translatedX && !this.decaying) {
                    this.checkUpdate();
                }
                this.translatedY = true;
            } else {
                this.translatedY = false;
            }
            this.totalOffset.y = value;
            //this.checkUpdate();
        });
        this.onGestureEvent = Animated.event(
            [
                {
                    nativeEvent: {
                        translationX: this.translateX,
                        translationY: this.translateY
                    },
                },
            ],
            { useNativeDriver: USENATIVEDRIVER }
        );
        this.pinchScale.addListener(( {value} ) => {
            if (this.pinchPoint == null) {
                this.pinchPoint = {
                    x: this.focalPoint.x,
                    y: this.focalPoint.y
                };
            }
            this.scaleValue = this.lastScale * value;
            var xValue = ((this.totalW / 2 - this.deviceW / 2) + this.lastOffset.x) * value - ((this.totalW / 2 - this.deviceW / 2) + this.lastOffset.x);
            var yValue = ((this.totalH / 2 - this.deviceH / 2) + this.lastOffset.y) * value - ((this.totalH / 2 - this.deviceH / 2) + this.lastOffset.y);
            this.translateX.setValue(xValue);
            this.translateY.setValue(yValue);
            this.checkUpdate();
        });
        this.focalX.addListener(( {value} ) => {
            this.focalPoint.x = value;
        });
        this.focalY.addListener(( {value} ) => {
            this.focalPoint.y = value;
        });
        this.onPinchGestureEvent = Animated.event(
            [{ nativeEvent: { 
                scale: this.pinchScale,
                focalX: this.focalX,
                focalY: this.focalY } }],
            { useNativeDriver: USENATIVEDRIVER }
        );
    }

    mapNodes = () => {
        var lines = [];
        var lineKeys = {};
        for (var nodeKey in NODES) {
            var node = NODES[nodeKey];
            lineKeys[nodeKey] = {};
            for (var conNodeKey of node.links) {
                var conNode = NODES[conNodeKey];
                if (conNode != null) {
                    if (lineKeys[conNodeKey] == null || !lineKeys[conNodeKey][nodeKey]) {
                        lineKeys[nodeKey][conNodeKey] = true;
                        var p1 = this.toPixels(node.lat, node.long);
                        var p2 = this.toPixels(conNode.lat, conNode.long);
                        lines.push({ key: nodeKey + conNodeKey, p1: p1, p2: p2 });
                    }
                } else {
                    console.log("Could not match node: ", conNodeKey, " to ", nodeKey);
                }
            }
        }
        this.setState({
            lines: lines
        });
    }

    componentWillMount = () => {
        PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    'title': 'ParkHero Location Permission',
                    'message': 'Used to update wait times and map navigation'
                }
            ).then((granted) => {
                if (granted) {
                    this.watchID = navigator.geolocation.watchPosition(
                        (position) => {
                            this.setState({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude
                            });
                        },
                        (error) => console.error("WatchPosition Failed: ", error),
                        { enableHighAccuracy: true });
                }
            });
        this.mapNodes();
    }

    componentWillUnmount() {
        if (this.watchID != null) {
            navigator.geolocation.stopObserving(this.watchID);
        }
    }

    toPixels(latitude, longitude) {
        var y = (((latitude - 33.80557) * -35.25 + 0.5555078125) * this.totalH / 2) * 1.136;
        var x = (((longitude - (-117.918677)) * 29.25 + 0.25037109375) * this.totalW / 2) * 1.136;
        return {
            x: x,
            y: y
        }
    }

    checkUpdate = () => {
        var scale = (this.HIGHEST_SCALE / this.scaleValue) / 2;
        var truncScale = Math.trunc(scale);
        if (truncScale > this.HIGHEST_SCALE) {
            truncScale = this.HIGHEST_SCALE;
        }
        if (truncScale != this.truncScale) {
            this.forceUpdate();
        }

        var dimSize = (Math.pow(2, this.HIGHEST_SCALE - truncScale) * this.HIGHEST_SCALE_COUNT);

        var adjustedX = -this.totalOffset.x;
        var adjustedY = -this.totalOffset.y;
        var x = adjustedX / this.scaleValue + (this.totalW * (this.scaleValue - 1.0) / 2.0) / this.scaleValue;
        var y = adjustedY / this.scaleValue + (this.totalH * (this.scaleValue - 1.0) / 2.0) / this.scaleValue;
        
        var rowOffset = Math.trunc((y / this.totalH) * dimSize);
        var colOffset = Math.trunc((x / this.totalW) * dimSize);
        if (rowOffset != this.rowOffset || colOffset != this.colOffset) {
            this.forceUpdate();
        }
    }

    onHandlerStateChange = event => {
        this.translatedX = false;
        this.translatedY = false;

        if (event.nativeEvent.oldState == 0) {
            this.decaying = false;
            this.translateX.stopAnimation(() => {
                this.lastOffset.x += this.animOffset.x;
                this.translateX.setOffset(this.lastOffset.x);
                this.translateX.setValue(0);
            });

            this.translateY.stopAnimation(() => {
                this.lastOffset.y += this.animOffset.y;
                this.translateY.setOffset(this.lastOffset.y);
                this.translateY.setValue(0);
            });
        }
        else if (event.nativeEvent.oldState === State.ACTIVE) {  
            this.decaying = true;

            this.lastOffset.x += event.nativeEvent.translationX;
            this.translateX.setOffset(this.lastOffset.x);
            this.translateX.setValue(0);

            this.lastOffset.y += event.nativeEvent.translationY;
            this.translateY.setOffset(this.lastOffset.y);
            this.translateY.setValue(0);
            
            Animated.decay(this.translateX,
                {
                    velocity: event.nativeEvent.velocityX / 2000.0,
                    deceleration: 0.99,
                    useNativeDriver: USENATIVEDRIVER
                }).start(() => {
                    if (this.translatedY) {
                        this.checkUpdate();
                    }
                    this.translatedX = true;
                })

            Animated.decay(this.translateY,
                {
                    velocity: event.nativeEvent.velocityY / 2000.0,
                    deceleration: 0.99,
                    useNativeDriver: USENATIVEDRIVER
                }).start(() => {
                    if (this.translatedX) {
                        this.checkUpdate();
                    }
                    this.translatedY = true;
                });
        }
    };

    onPinchHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            this.lastScale *= event.nativeEvent.scale;
            this.baseScale.setValue(this.lastScale);
            this.pinchScale.setValue(1);
            this.pinchPoint = null;
            var xValue = ((this.totalW / 2 - this.deviceW / 2) + this.lastOffset.x) * event.nativeEvent.scale - (this.totalW / 2 - this.deviceW / 2);
            var yValue = ((this.totalH / 2 - this.deviceH / 2) + this.lastOffset.y) * event.nativeEvent.scale - (this.totalH / 2 - this.deviceH / 2);
            this.translateX.setOffset(xValue);
            this.translateY.setOffset(yValue);
            this.translateX.setValue(0);
            this.translateY.setValue(0);
        }
    };

    render() {
        var map = this.renderMap();
        return (
            <PanGestureHandler
                {...this.props}
                onGestureEvent={this.onGestureEvent}
                onHandlerStateChange={this.onHandlerStateChange}
                minPointers={1}
                maxPointers={1}>
                <PinchGestureHandler
                    onGestureEvent={this.onPinchGestureEvent}
                    onHandlerStateChange={this.onPinchHandlerStateChange}>
                                <Animated.View style={{ position: 'absolute', width: 10000, height: 10000, transform: [ { translateX: this.translateX },
                                    { translateY: this.translateY }, { scale: this.scale } ] }}>
                                    { map }
                                </Animated.View>
                </PinchGestureHandler>
            </PanGestureHandler>
        );
    }

    renderNav = () => {
        /*
        return <View
            style={{
                position: 'absolute',
                width: 5000,
                height: 5000,
                left: 2000,
                top: 2000
            }}>
                <Svg style={{ position: 'absolute', left: 0, top: 0, transform: [ { scale: 5 } ]}} height={1000} width={1000} viewBox="0 0 5000 5000">
                    <Rect
                        x="0"
                        y="0"
                        width="500"
                        height="500"
                        stroke="red"
                        strokeWidth="20"
                        fill="yellow"
                    />
                </Svg>
        </View>
        */
        return <View
            style={{
                position: 'absolute',
                width: 5000,
                height: 5000,
                left: 2000,
                top: 2000
            }}>
                <Svg style={{ position: 'absolute', left: 0, top: 0, transform: [ { scale: 5 } ]}} height={1000} width={1000} viewBox="0 0 5000 5000">
                    {
                        this.state.lines.map((line) => {
                            return (<Line
                                x1={line.p1.x}
                                y1={line.p1.y}
                                x2={line.p2.x}
                                y2={line.p2.y}
                                stroke="rgb(221, 209, 197)"
                                strokeWidth="20"
                            />);
                        })
                    }
                </Svg>
        </View>
    }

    renderMap = () => {
        var nav = this.renderNav();

        var scale = (this.HIGHEST_SCALE / this.scaleValue) / 2;
        this.truncScale = Math.trunc(scale);
        if (this.truncScale > this.HIGHEST_SCALE) {
            this.truncScale = this.HIGHEST_SCALE;
        }
        var scaleStr = this.truncScale.toString();
        if (scaleStr.length == 1) {
            scaleStr = "0" + scaleStr;
        }
        var dimSize = (Math.pow(2, this.HIGHEST_SCALE - this.truncScale) * this.HIGHEST_SCALE_COUNT);

        var visibleWScaled = this.deviceW / this.scaleValue;
        var visibleHScaled = this.deviceH / this.scaleValue;
        var adjustedX = -this.totalOffset.x;
        var adjustedY = -this.totalOffset.y;
        var x = adjustedX / this.scaleValue + (this.totalW * (this.scaleValue - 1.0) / 2.0) / this.scaleValue;
        var y = adjustedY / this.scaleValue + (this.totalH * (this.scaleValue - 1.0) / 2.0) / this.scaleValue;
        
        var images = [];
        this.rowOffset = Math.trunc((y / this.totalH) * dimSize);
        this.colOffset = Math.trunc((x / this.totalW) * dimSize);
        for (var rowI = -1; rowI < (visibleHScaled / this.totalH) * dimSize + 1; rowI++) {
            for (var colI = -1; colI < (visibleWScaled / this.totalW) * dimSize + 1; colI++) {
                var imgI = rowI + this.rowOffset;
                var imgIStr = imgI.toString();
                if (imgIStr.length == 1) {
                    imgIStr = "0" + imgIStr;
                }
                var imgJ = colI + this.colOffset;
                var imgJStr = imgJ.toString();
                if (imgJStr.length == 1) {
                    imgJStr = "0" + imgJStr;
                }
                var fileName = 'rss' + imgIStr + imgJStr + scaleStr + ".webp";
                images.push(<CachedImage
                    key={fileName}
                    style={{
                        position: 'absolute',
                        left: ((imgJStr * this.totalW) / dimSize) / 2.0,
                        top: ((imgIStr * this.totalH) / dimSize) / 2.0,
                        width: this.totalW / dimSize + 1,
                        height: this.totalH / dimSize + 1
                    }}
                    source={{
                        uri: 'http://disneymap.s3-website-us-west-1.amazonaws.com/wpresults/' + fileName
                    }}
                    activityIndicatorProps={{
                        color: "rgba(0, 0, 0, 0)"
                    }}
                    resizeMode={'contain'} />);
            }
        }

        var userMarker = null;
        if (this.state.latitude != null) {
            var userPixelPos = this.toPixels(this.state.latitude, this.state.longitude);
            if (userPixelPos.x >= 0 && userPixelPos.x < this.totalW / 2 && userPixelPos.y >= 0 && userPixelPos.y < this.totalH / 2) {
                userMarker = <View 
                    key={"userMarker"}
                    style={{
                        position: 'absolute',
                        left: userPixelPos.x,
                        top: userPixelPos.y,
                        width: this.markerRadius * 2,
                        height: this.markerRadius * 2,
                        
                        backgroundColor: 'red'
                    }}/>
            }
        }
        return (
                <View style={{
                    width: this.totalW,
                    height: this.totalH,
                    backgroundColor: 'blue'
                }}>
                    { nav }
                    { images }
                    { userMarker }
                </View>
        );
    }
}