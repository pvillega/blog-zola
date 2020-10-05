+++
title = "Raspberry Pi as NAS with Samba"
date = 2014-01-12

[taxonomies]
categories = ["devops"]
tags = ["devops", "raspberry", "crashplan", "deluged"]
+++

This year I've bought a [Raspberry Pi](http://www.raspberrypi.org/). I've wanted to play with it for a long time, but it was one of these things you keep delaying as I wasn't sure what to use it for. After moving to London, and given that my NAS died, I found myself in need of a replacement, one that allowed me to install [Crashplan](http://www.code42.com/crashplan/) on it if possible (for cloud backup).

<!-- more -->

A commercial NAS unit was a no go even if they had support for Crashplan: they are quite expensive and my experience with Lacie units has not been the best. Having a desktop on 24/7 to manage backups would allow me to install Crashplan on it, but it seemed a waste of cpu and electricity. And here is when Raspberry Pi came to save the day: it can be used as a low power PC, but it has enough RAM and CPU to work as NAS and provide some other services. Low power consumption (some estimates are £5-10 per year) and my files are safe. Success!

As I write this I have my Raspberry Pi connected to 1 Tb storage, using [Samba](http://www.samba.org/) to allow access to the files across the network and backing up all my data via Crashplan. It can even serve videos to my TV via [DLNA](http://www.dlna.org/). It is not complex to do, but it required browsing a few articles online and putting together some information. In this post I summarise the steps on how to achieve this. I apologise in advance as the post has no images, which makes it a bit dry, but hopefully it is easy to follow.

# Requirements

To follow these steps you need:

* Raspberry Pi B with 8 Gb SD card. Take the B model as it has 512Mb of RAM (and you WILL need them). Also buy the SD card they sell, as it has the default operating system (Raspbian) preloaded. It saves time and problems.
* Seagate Backup Plus (1 Tb). This hard drive doesn't require an external power cable, it only uses 1 USB cable to connect it to the Raspberry unit, which makes it convenient.
* Power supply for Raspberry Pi. They sell one in their shop, but you can also use any mini USB power supply you have that follows their specifications.
* HDMI cable. To connect Raspberry Pi to a monitor during the initial setup.
* USB keyboard. For the first configuration steps.
* Network cable. You will have one USB port taken by the HD, so it's better to keep the other free for a keyboard and connect the Raspberry to the network by cable.

Once you have all the pieces, you can start. I have added references to the sources where I found how to set up the Raspberry in each section, but if you get stuck check [Stack Exchange](http://raspberrypi.stackexchange.com/) as they have a forum dedicated to Raspberry with a lot of useful information.

# Setup of Raspberry Pi

Raspberry has a helpful [guide to set up](http://www.raspberrypi.org/wp-content/uploads/2012/04/quick-start-guide-v2_1.pdf) the unit. If you bought the SD card with NOOBS preinstalled then you can skip the few first steps and go straight to the part talking about the first boot.

Basically, select Raspbian (the recommended OS for Raspberry, [Debian](http://www.debian.org/) based) and wait for it to be installed. It will take a while. Then you will be prompted to restart the unit. After rebooting Raspbian will automatically load a configuration menu, in which we will tweak some options:

* Option 1, expand filesystem. It is not needed in NOOBS but run it just in case
* Option 2, set a new password for the user pi. Given that we will log via ssh, you need this
* Option 8, in advanced options make sure that ssh is enabled. I also overclocked the unit (middle option) as it will be running quite a few services.

Once you are done, exit and reboot the unit. Then log into it and install [avahi](http://en.wikipedia.org/wiki/Avahi_(software)):

```bash
sudo apt-get install avahi-daemon
```

This will allow us to ssh to the Raspberry via the hostname *raspberrypi.local*, removing the need to keep track of its ip. Once installed, reboot again the unit and try to log into it via ssh:

```bash
ssh pi@raspberrypi.local
```

This is the recommended way to connect to the Raspberry Pi. You can remove the HDMI cable and the keyboard from the unit and use ssh from now on to operate on it.

Here is [another guide](http://www.howtogeek.com/138281/the-htg-guide-to-getting-started-with-raspberry-pi/) that can help you by covering areas that may not be clear.

# Raspberry as NAS

After setting our Raspberry Pi, we will turn it into a NAS system using Samba, so we can copy files across the network. This requires the external HD to be connected to the unit. There are a couple of step by step [guides](http://www.howtogeek.com/139433/how-to-turn-a-raspberry-pi-into-a-low-power-network-storage-device/) [available](http://www.makeuseof.com/tag/turn-your-raspberry-pi-into-a-nas-box/) which can help you through the process. The guides also mention how to use a second hard drive for local data redundancy. I only use one HD by now, but it can be a recommended step to ensure you don't lose data.

As per the guides, the HD is left in NTFS. It is slower than EXT4, but allows us to connect it to a Windows machine directly in case of need. To be able to use that filesystem we need some extra packages, installed via:

```bash
sudo apt-get install ntfs-3g
```

## Mounting the HD

The external hard drive (if you only use one) will be recognised as **/dev/sda1** by Raspbian. We need to mount it permanently in our filesystem. I chose to mount it in the folder */media/hd1*, by doing the following:

```bash
sudo mkdir /media/hd1
sudo mount -t auto /dev/sda1 /media/hd1
```
This creates the folder, and mounts the external HD into it. We now need to tell the system to mount the unit every time it boots. Edit *fstab*:

```bash
sudo nano /etc/fstab
```

and add the following line at the bottom:

```
/dev/sda1 /media/hd1 auto noatime 0 0
```

Save and you can restart the Raspberry Pi to check that the disk is mounted at */media/hd1*.

## Samba

We use a specific folder in the HD for our Samba share, so we can isolate the shared folder from other files we may want to store in the disk.

```bash
sudo mkdir /media/hd1/share
```

Install Samba, do a backup of the default configuration and edit it by running:

```bash
sudo apt-get install samba samba-common-bin
sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.old
sudo nano /etc/samba/smb.conf
```

In the config file, uncomment the line:

```
security = user
```

and add at the bottom of the file:

```
[Share]
comment = My share
path = /media/hd1/share
valid users = @users
force group = users
create mask = 0660
directory mask = 0771
read only = no
```

I also took a page of this [guide](https://calomel.org/samba_optimize.html) on optimising Samba and replaced the *socket options* in the file by:

```
socket options = TCP_NODELAY IPTOS_LOWDELAY SO_RCVBUF=65536 SO_SNDBUF=65536
```

with the aim of improving performance.

The next step is creating a user that can access the share when connecting via the network. I created a user called *nas*, typing the password I chose when prompted:

```
useradd nas -m -G users
passwd nas
smbpasswd -a nas
```

Restart Samba:

```
service samba restart
```

and you should be able to access the share in your network by using the user *nas* and its credentials.

# Crashplan

Crashplan is my tool of choice for remote backups, sending the data in our NAS to the cloud. We will run it as a headless client, which means that we run the service in Raspberry but the client, which we use to configure the backup options, runs in another computer and connects via the network.

The service is a Java application, which means that we have to install the *jvm* into Raspberry Pi. Given that the Oracle implementation is much better than the OpenJDK one, the first step is to purge OpenJDK and install Oracle's Java, ensuring it is the default choice in the system:

```
sudo apt-get purge openjdk-\* icedtea-\* icedtea6-\*
sudo apt-get install oracle-java7-jdk
sudo update-alternatives --list java
sudo update-alternatives —config java
```

At this point, we can follow the steps in [this guide](http://www.bionoren.com/blog/2013/02/raspberry-pi-crashplan/) to install Crashplan in our Raspberry.  The guide also install Java 8, we skip that and go straight to point 8. I summarise the steps in here as a quick reference.

First [Download](http://www.crashplan.com/consumer/download.html?os=Linux) Crashplan for Linux, copy it to the Raspberry (via scp) and extract it there. Then run the installer:

```
sudo Crashplan-install/install.sh
```

Accept the license and select the default locations for the installation. Then you need to patch [libjtux](http://www.jonrogers.co.uk/wp-content/uploads/2012/05/libjtux.so) and [md5 library](http://www.jonrogers.co.uk/wp-content/uploads/2012/05/libmd5.so) by downloading the linked files and copying them to */usr/local/crashplan/*.

You also need to install *libjna* for Java:
```
sudo apt-get install libjna-java
```

Once done, edit */usr/local/crashplan/bin/CrashPlanEngine* and find the line that begins with *FULL_CP=*, around the start case, and edit it so it looks like:

```
FULL_CP="/usr/share/java/jna.jar:$TARGETDIR/lib/com.backup42.desktop.jar:$TARGETDIR/lang"
```

The last step is to run the Crashplan engine at boot time by editing */etc/rc.local* and adding on the line above *exit 0*:

```
/usr/local/crashplan/bin/CrashPlanEngine start
```

Restart the unit and if everything worked when you run:
```
/usr/local/crashplan/bin/CrashPlanEngine status
```
you should see the service is running.

There is [a comment](http://www.bionoren.com/blog/2013/02/raspberry-pi-crashplan/#comment-97) in the above guide that shows how to modify the swap to point to another file. There are two good reasons for this. First of all, the default swap in Raspberry is not much, and Raspbian may kill processes heavy in RAM when running low on memory, increasing the swap will avoid it killing Crashplan on a whim. Secondly, Java may do heavy use of the swap and thus shorten the life of the SD card by doing many writes to it, which we can fix by moving the swap to our external disk. I created a swap file in the external hd by following the instructions:

```
dd if=/dev/zero of=/media/hd1/swapfile bs=1M count=1024
mkswap /media/hd1/swapfile
chown root:root /media/hd1/swapfile
chmod 0600 /media/hd1/swapfile
swapon /media/hd1/swapfile
sudo apt-get purge dphys-swapfile
```

Then we apply this change on each boot by editing */etc/fstab* and adding to the bottom (to ensure the disk that contains the swap is mounted first):
```
/media/hd1/swapfile swap swap defaults 0 0
```

Restart the Raspberry and execute *free*. You should see a swap of 1Gb.

I won't enter into detail on how to connect a headless client as the [official guide](http://support.code42.com/CrashPlan/Latest/Configuring/Configuring_A_Headless_Client) explains it perfectly. Just remember that you will need to run the tunnel every time you connect via the client, and the tunnels timeout from time to time.

Now configure Crashplan to backup the files in */media/hd1/share* to their cloud and you are done.

There is an optional last step you can follow. The settings above should ensure that Crashplan is not killed by Raspbian, but this may happen. To fix this without us having to ssh into the box every day, I've added a *cronjob* that restarts the Raspberry every day at 2 am. If you are not a *crontab* expert you can see how to do this [in this stack exchange](http://raspberrypi.stackexchange.com/questions/2150/how-do-i-reboot-at-a-specific-time) question, just replace the *0,8* by a *2*. In my case 2am is not a time when I will be using the NAS, so a restart should not be an issue and it will ensure that any services that were killed are restarted accordingly.


# Torrents

We have a NAS backed up in the cloud. Given that it will be running 24/7, we can try to squeeze it a bit more by adding a torrent client to the box. That way you can download you latest Linux distro without having to keep your desktop on all night, Raspberry rakes care about it. There is a guide on how to [install deluge](http://www.howtogeek.com/142044/how-to-turn-a-raspberry-pi-into-an-always-on-bittorrent-box/) as a headless server, which we can then access via a remote client or a web interface.

To start, we install *deluged* and we run it so it creates the default config files:
```bash
sudo apt-get install deluged
sudo apt-get install deluge-console
deluged
```

Wait for a couple of minutes so all the files are created, and then kill the process:
```bash
sudo pkill deluged
```

Now we backup the authentication file and edit it to add a new user:
```bash
cp ~/.config/deluge/auth ~/.config/deluge/auth.old
nano ~/.config/deluge/auth
```

There you can add a user in the format *user:password:10*. The user and password don't need to match any existing user, they are the credentials you will use to remotely connect to the server via the client. Now we start the service again and we enter into the console:

```bash
deluged
deluge-console
```

In the console we run the following commands to allow for remote connections to the service:
```
config -s allow_remote True
config allow_remote
exit
```

And to apply the new configuration we restart the service:

```bash
sudo pkill deluged
deluged
```

The last step is to run *deluged* at boot time by editing */etc/rc.local* and adding on the line above *exit 0*:

```
/usr/bin/deluged
```

I won't explain how to connect via the client as the guide linked above has a complete explanation, with images, and it is quite straightforward. I just recommend you to only download 1 torrent at once and to set the destination folder for all the torrents to a path inside the *samba share*, so you can access it from the network. Just make sure Crashplan doesn't backup that folder. As we have plenty of memory in use in this Raspberry I've not installed the web interface as I thought it was of little benefit and we can use that RAM for other things.

# DLNA

Given the amount of storage in the NAS, we will probably keep plenty of photos and videos in it. We can install a [DLNA](http://www.dlna.org/) compliant server in our Raspberry that will index all the media files in our share and make them available to any DLNA compatible device: smartphones, laptops or TVs. We do this by installing *minidlna*, an open source implementation of the protocol.

The process, taken from [this guide](http://www.raspberrypi.org/phpBB3/viewtopic.php?t=16352), is extremely simple. Be aware that the guide does many other things we already took care of, just skip them and scroll down to the part that says *install minidlna*. In your Raspberry run:

```bash
sudo apt-get install minidlna
sudo update-rc.d minidlna defaults
```

With this minidlna is installed and ready to run when rebooting the unit. Modify the configuration by editing */etc/minidlna.conf* (as root). In the config, look for the following sections and update accordingly:

```
media_dir=A,/media/hd1/share/Music
media_dir=V,/media/hd1/share/Video
media_dir=P,/media/hd1/share/Photos

db_dir=/media/hd1/dlna

log_dir=/media/hd1/dlna
```

The media folders are an example, set them accordingly as per your *share* folder structure. The other two entries store minidlna metadata and logs in the external hd so we have enough room for them.

Restart the service via:

```
sudo service minidlna force-reload
```

And wait for the service to index all the files. It is quite fast, depending on how many media files you own, but until a file is indexed you won't be able to access it.


# Conclusion

You are done, you have a NAS with full cloud backup, torrenting capabilities and that can act as a media centre and show videos or photos in your TV. Congratulations! Enjoy it as much as I do enjoy mine :)
