import {
  Animated,
  InteractionManager,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  observable,
  action,
} from 'mobx';
import { RecordStore } from 'stores';

class RecordViewModel {
  @observable
  public isAlbumVisible = false;

  @observable
  public isEntered = false;

  private isBusy = false;

  private store: RecordStore;

  private progressAnimation = new Animated.Value(1);

  private fadeAnimation = new Animated.Value(1);

  private albumFadeAnimation = new Animated.Value(1);

  constructor(store: RecordStore) {
    this.store = store;
  }

  public get isRecorded() {
    return this.store.duration > 0;
  }

  public get backgroundResource() {
    return this.store.backgroundResource;
  }

  public get progressStyle() {
    return {
      transform: [{
        scale: this.progressAnimation,
      }],
    };
  }

  public get fadeStyle() {
    return {
      opacity: this.fadeAnimation,
    };
  }

  public get albumFadeStyle() {
    return {
      opacity: this.albumFadeAnimation,
    };
  }

  public reset = () => {
    this.store.reset();
  }

  @action
  public toggleAlbum = () => {
    this.isAlbumVisible = !this.isAlbumVisible;

    Animated.timing(this.albumFadeAnimation, {
      toValue: Number(!this.isAlbumVisible),
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  @action
  public toggle = () => {
    if (this.isBusy) {
      return;
    }

    if (this.isEntered) {
      this.stop();
    } else {
      this.start();
    }
  }

  public changeBackgroundResource = (url: string) => {
    this.store.changeBackgroundResource(url);
  }

  public changeDescription = (text: string) => {
    this.store.changeDescription(text);
  }

  private start = async () => {
    if (this.isRecorded) {
      this.startPlay();
    } else {
      const granted = await this.requestMicrophonePermission();

      if (!granted) {
        return;
      }

      this.startRecord();
    }

    Animated.timing(this.fadeAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(this.progressAnimation, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(this.progressAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }

  private startRecord = () => {
    requestAnimationFrame(async () => {
      await this.store.startRecord();
      this.isEntered = true;
    });
  }

  private startPlay = () => {
    this.store.startPlay(this.stop);
    this.isEntered = true;
  }

  private stop = () => {
    this.isRecorded ? this.stopPlay() : this.stopRecord();
    Animated.timing(this.fadeAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(this.progressAnimation, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }

  private stopRecord = () => {
    this.isBusy = true;
    InteractionManager.runAfterInteractions(async () => {
      await this.store.stopRecord();
      this.isEntered = false;
      this.isBusy = false;
    });
  }

  private stopPlay = () => {
    this.store.stopPlay();
    this.isEntered = false;
  }

  private requestMicrophonePermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error(err);
    }

    return false;
  }
}

export default RecordViewModel;